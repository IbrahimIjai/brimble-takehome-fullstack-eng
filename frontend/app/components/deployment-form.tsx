import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, GitBranch, Plus, Terminal, Upload } from "lucide-react";

import { createGitDeployment, createUploadDeployment, type Deployment } from "~/lib/api";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface DeploymentFormProps {
  onCreated?: (deployment: Deployment) => void;
}

export function DeploymentForm({ onCreated }: DeploymentFormProps) {
  const queryClient = useQueryClient();

  const [sourceType, setSourceType] = useState<"git" | "upload">("git");
  const [gitUrl, setGitUrl] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [formError, setFormError] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      if (sourceType === "git") {
        if (!gitUrl.trim()) throw new Error("Please enter a Git URL");
        return createGitDeployment(gitUrl.trim());
      }

      if (!uploadFile) throw new Error("Please select a file to upload");
      return createUploadDeployment(uploadFile);
    },
    onSuccess: (newDeployment) => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
      setGitUrl("");
      setUploadFile(null);
      setFormError("");
      onCreated?.(newDeployment);
    },
    onError: (err: Error) => {
      setFormError(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    createMutation.mutate();
  }

  return (
    <Card className="border-border bg-card backdrop-blur-sm">
      <CardHeader>
        <div className="mb-2 flex items-center gap-2 text-blue-400">
          <Plus className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Create New</span>
        </div>
        <CardTitle className="text-xl">Deploy Service</CardTitle>
        <CardDescription className="text-muted-foreground">
          Connect your source code to get started.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={sourceType} onValueChange={(v) => setSourceType(v as "git" | "upload")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 border border-border bg-muted p-1">
            <TabsTrigger value="git" className="gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground">
              <GitBranch className="h-3.5 w-3.5" />
              Git URL
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground">
              <Upload className="h-3.5 w-3.5" />
              Upload
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <TabsContent value="git" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="git-url" className="text-xs font-semibold text-muted-foreground">
                  Repository URL
                </Label>
                <Input
                  id="git-url"
                  type="url"
                  placeholder="https://github.com/user/repo"
                  value={gitUrl}
                  onChange={(e) => setGitUrl(e.target.value)}
                  className="bg-background"
                />
              </div>
            </TabsContent>

            <TabsContent value="upload" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload" className="text-xs font-semibold text-muted-foreground">
                  Project Archive
                </Label>
                <div className="group relative">
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".zip,.tar.gz,.tgz"
                    onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                    className="h-auto cursor-pointer border-dashed border-border bg-background px-4 py-8 text-center text-muted-foreground transition-colors hover:bg-muted/50 file:hidden"
                  />
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-muted-foreground transition-colors group-hover:text-foreground/80">
                    <Upload className="mb-2 h-6 w-6 opacity-50" />
                    <p className="text-xs">{uploadFile ? uploadFile.name : "Select .zip or .tar.gz"}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{formError}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 py-6 text-base font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  Deploying...
                </span>
              ) : (
                "Deploy Service"
              )}
            </Button>
          </form>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2 border-t border-border bg-muted/20 px-6 py-4 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <Terminal className="h-3 w-3" />
          <span>Your service will be assigned a unique subdomain.</span>
        </div>
      </CardFooter>
    </Card>
  );
}
