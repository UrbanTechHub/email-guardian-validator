
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X, Loader } from "lucide-react";

const Index = () => {
  const [validatingProgress, setValidatingProgress] = useState(0);
  const [validationResults, setValidationResults] = useState<{valid: string[], invalid: string[]}>({
    valid: [],
    invalid: []
  });
  const [isValidating, setIsValidating] = useState(false);

  const validateEmail = (email: string): boolean => {
    // More comprehensive email validation regex
    const emailRegex = /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-zA-Z0-9-]*[a-zA-Z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/;
    
    if (!email) return false;
    
    // Basic format checks
    if (email.length > 254) return false;
    if (email.startsWith('.') || email.endsWith('.')) return false;
    
    return emailRegex.test(email);
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
      const batchSize = 10; // Reduced to 10 emails per batch

      for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);
        
        for (const email of batch) {
          if (validateEmail(email)) {
            valid.push(email);
          } else {
            invalid.push(email);
          }
        }
        
        setValidatingProgress(Math.round(((i + batch.length) / total) * 100));
        await new Promise(resolve => setTimeout(resolve, 100));
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
          <p className="text-lg text-gray-600">Validate your email list with confidence</p>
        </div>

        <Card className="backdrop-blur-sm bg-white/90 border border-gray-200 rounded-xl p-8 shadow-lg mb-8">
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
        </Card>
      </div>
    </div>
  );
};

export default Index;
