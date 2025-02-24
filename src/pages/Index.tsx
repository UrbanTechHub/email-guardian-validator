
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Index = () => {
  const [validatingProgress, setValidatingProgress] = useState(0);
  const [validationResults, setValidationResults] = useState<{valid: string[], invalid: string[]}>({
    valid: [],
    invalid: []
  });
  const [isValidating, setIsValidating] = useState(false);

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
      const emails = text.split('\n').map(email => email.trim()).filter(email => email);
      const total = emails.length;
      const valid: string[] = [];
      const invalid: string[] = [];

      // Email validation regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        if (emailRegex.test(email)) {
          valid.push(email);
        } else {
          invalid.push(email);
        }
        
        setValidatingProgress(Math.round(((i + 1) / total) * 100));
        // Add a small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setValidationResults({ valid, invalid });
      toast.success("Validation complete!");
    } catch (error) {
      toast.error("Error processing file");
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Email Validator</p>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Validate Your Email List</h1>
          <p className="text-lg text-gray-600">Upload a .txt file with one email per line</p>
        </div>

        <Card className="backdrop-blur-sm bg-white/80 border border-gray-200 rounded-xl p-8 shadow-sm mb-8">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200
              ${isDragActive 
                ? 'border-gray-400 bg-gray-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="text-gray-600">
                {isDragActive ? (
                  <p>Drop your file here</p>
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
                <span>Validating emails...</span>
                <span>{validatingProgress}%</span>
              </div>
              <Progress value={validatingProgress} className="h-2" />
            </div>
          )}

          {!isValidating && validationResults.valid.length > 0 && (
            <div className="mt-8 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Results</h3>
                  <Button
                    onClick={downloadResults}
                    size="sm"
                    className="transition-all duration-200 hover:scale-105"
                  >
                    Download Results
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Valid Emails</p>
                    <p className="text-2xl font-bold text-green-600">
                      {validationResults.valid.length}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Invalid Emails</p>
                    <p className="text-2xl font-bold text-red-600">
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
