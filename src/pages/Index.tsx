
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X, Loader } from "lucide-react";

const ABSTRACT_API_KEY = '806fca6867224a2db4c6230015d239ca'; // You'll need to add your API key here
const API_URL = 'https://emailvalidation.abstractapi.com/v1/';

interface EmailValidationResponse {
  email: string;
  deliverability: string;
  quality_score: number;
  is_valid_format: boolean;
  is_free_email: boolean;
  is_disposable_email: boolean;
  is_role_email: boolean;
  is_catchall_email: boolean;
  is_mx_found: boolean;
  is_smtp_valid: boolean;
}

const Index = () => {
  const [validatingProgress, setValidatingProgress] = useState(0);
  const [validationResults, setValidationResults] = useState<{valid: string[], invalid: string[]}>({
    valid: [],
    invalid: []
  });
  const [isValidating, setIsValidating] = useState(false);

  const validateSingleEmail = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `${API_URL}?api_key=${ABSTRACT_API_KEY}&email=${encodeURIComponent(email)}`
      );
      const data: EmailValidationResponse = await response.json();
      
      // Consider an email valid if:
      // 1. It has valid format
      // 2. MX records exist
      // 3. SMTP is valid
      // 4. Deliverability is not "UNDELIVERABLE"
      return (
        data.is_valid_format &&
        data.is_mx_found &&
        data.is_smtp_valid &&
        data.deliverability !== "UNDELIVERABLE"
      );
    } catch (error) {
      console.error("Error validating email:", error);
      return false;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (file.type !== 'text/plain') {
      toast.error("Please upload a .txt file");
      return;
    }

    setIsValidating(true);
    setValidatingProgress(0);
    
    try {
      const text = await file.text();
      const emails = text.split('\n')
        .map(email => email.trim())
        .filter(email => email);
      
      if (emails.length === 0) {
        toast.error("No emails found in the file");
        setIsValidating(false);
        return;
      }

      const total = emails.length;
      const valid: string[] = [];
      const invalid: string[] = [];
      const batchSize = 10; // Process 10 emails at a time

      for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);
        
        // Process emails in batch with a delay to respect API rate limits
        for (const email of batch) {
          const isValid = await validateSingleEmail(email);
          if (isValid) {
            valid.push(email);
          } else {
            invalid.push(email);
          }
          
          // Add a small delay between API calls to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        setValidatingProgress(Math.round(((i + batch.length) / total) * 100));
      }

      setValidationResults({ valid, invalid });
      toast.success(`Validation complete! Found ${valid.length} valid and ${invalid.length} invalid emails.`);
    } catch (error) {
      toast.error("Error processing file");
      console.error("Error processing file:", error);
    } finally {
      setIsValidating(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt']
    },
    multiple: false
  });

  const downloadResults = () => {
    const content = `Valid Emails:\n${validationResults.valid.join('\n')}\n\nInvalid Emails:\n${validationResults.invalid.join('\n')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'validation-results.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block p-2 bg-blue-50 rounded-lg mb-4">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Email List Validator
            </h1>
          </div>
          <p className="text-lg text-gray-600">Deep validation of your email list</p>
        </div>

        <Card className="backdrop-blur-sm bg-white/90 border border-gray-200 rounded-xl p-8 shadow-lg mb-8">
          {!ABSTRACT_API_KEY ? (
            <div className="text-center p-6">
              <p className="text-red-600 mb-2">API Key Not Configured</p>
              <p className="text-gray-600">Please add your Abstract API key to enable email validation.</p>
            </div>
          ) : (
            <>
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200
                  ${isDragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }
                `}
              >
                <input {...getInputProps()} />
                <div className="space-y-4">
                  <div className="text-gray-600">
                    {isDragActive ? (
                      <p className="text-blue-600 font-medium">Drop your file here</p>
                    ) : (
                      <p>Drag and drop your file here, or click to select</p>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">.txt files only</p>
                </div>
              </div>

              {isValidating && (
                <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-2">
                      <Loader className="animate-spin" size={16} />
                      <span>Validating emails...</span>
                    </div>
                    <span className="font-medium">{validatingProgress}%</span>
                  </div>
                  <Progress value={validatingProgress} className="h-2" />
                </div>
              )}

              {!isValidating && validationResults.valid.length > 0 && (
                <div className="mt-8 space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">Results</h3>
                      <Button
                        onClick={downloadResults}
                        variant="outline"
                        size="sm"
                        className="transition-all duration-200 hover:scale-105 hover:bg-blue-50"
                      >
                        Download Results
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-6 mt-4">
                      <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Check className="text-green-600" size={20} />
                          <p className="text-sm font-medium text-green-800">Valid Emails</p>
                        </div>
                        <p className="text-3xl font-bold text-green-600">
                          {validationResults.valid.length}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-red-50 border border-red-100">
                        <div className="flex items-center gap-2 mb-2">
                          <X className="text-red-600" size={20} />
                          <p className="text-sm font-medium text-red-800">Invalid Emails</p>
                        </div>
                        <p className="text-3xl font-bold text-red-600">
                          {validationResults.invalid.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Index;
