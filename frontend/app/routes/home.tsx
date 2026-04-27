import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDeployments,
  createGitDeployment,
  createUploadDeployment,
  deleteDeployment,
  getDeploymentUrl,
  type Deployment,
} from "../lib/api";
import { StatusBadge } from "~/components/StatusBadge";
import { LogViewer } from "~/components/LogViewer";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Separator } from "~/components/ui/separator";
import { Badge } from "~/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { 
  Rocket, 
  GitBranch, 
  Upload, 
  ExternalLink, 
  Trash2, 
  Terminal, 
  Plus, 
  AlertCircle,
  Clock,
  Box
} from "lucide-react";
import { cn } from "~/lib/utils";
import { buttonVariants } from "~/components/ui/button";

export default function Home() {
  const queryClient = useQueryClient();

  const [sourceType, setSourceType] = useState<"git" | "upload">("git");
  const [gitUrl, setGitUrl] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [formError, setFormError] = useState("");
  const [openLogsId, setOpenLogsId] = useState<string | null>(null);

  const { data: deployments = [], isLoading } = useQuery({
    queryKey: ["deployments"],
    queryFn: fetchDeployments,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (sourceType === "git") {
        if (!gitUrl.trim()) throw new Error("Please enter a Git URL");
        return createGitDeployment(gitUrl.trim());
      } else {
        if (!uploadFile) throw new Error("Please select a file to upload");
        return createUploadDeployment(uploadFile);
      }
    },
    onSuccess: (newDeployment) => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
      setOpenLogsId(newDeployment.id);
      setGitUrl("");
      setUploadFile(null);
      setFormError("");
    },
    onError: (err: Error) => {
      setFormError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDeployment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    createMutation.mutate();
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 selection:bg-blue-500/30">
      {/* --- Header --- */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white sm:text-base">Brimble</h1>
              <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">PaaS Platform</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="hidden border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400 sm:flex">
              v1.0.0-beta
            </Badge>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
              <GitBranch className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* --- Left Column: Deployments List --- */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-white">Deployments</h2>
                <p className="text-sm text-zinc-500">Manage and monitor your running services</p>
              </div>
              <Badge variant="secondary" className="bg-zinc-900 text-zinc-400 border-white/5">
                {deployments.length} Active
              </Badge>
            </div>

            {isLoading ? (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
                <div className="flex flex-col items-center gap-4 text-zinc-500">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
                  <p className="text-sm font-medium">Fetching deployments...</p>
                </div>
              </div>
            ) : deployments.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 border border-white/5 text-zinc-500">
                  <Box className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">No deployments yet</h3>
                <p className="mt-2 text-sm text-zinc-500 max-w-xs">
                  Your services will appear here once you've deployed them. Start by connecting a repository.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {deployments.map((deployment: Deployment) => (
                  <DeploymentCard
                    key={deployment.id}
                    deployment={deployment}
                    logsOpen={openLogsId === deployment.id}
                    onToggleLogs={() =>
                      setOpenLogsId(openLogsId === deployment.id ? null : deployment.id)
                    }
                    onDelete={() => deleteMutation.mutate(deployment.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* --- Right Column: Deploy Form --- */}
          <div className="space-y-6">
            <Card className="border-white/5 bg-zinc-900/50 shadow-2xl backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <Plus className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Create New</span>
                </div>
                <CardTitle className="text-xl">Deploy Service</CardTitle>
                <CardDescription className="text-zinc-500">
                  Connect your source code to get started.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs value={sourceType} onValueChange={(v) => setSourceType(v as any)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-zinc-950 p-1 border border-white/5">
                    <TabsTrigger value="git" className="data-[state=active]:bg-zinc-900 data-[state=active]:text-white gap-2">
                      <GitBranch className="h-3.5 w-3.5" />
                      Git URL
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="data-[state=active]:bg-zinc-900 data-[state=active]:text-white gap-2">
                      <Upload className="h-3.5 w-3.5" />
                      Upload
                    </TabsTrigger>
                  </TabsList>
                  
                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <TabsContent value="git" className="mt-0 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="git-url" className="text-xs font-semibold text-zinc-400">Repository URL</Label>
                        <Input
                          id="git-url"
                          type="url"
                          placeholder="https://github.com/user/repo"
                          value={gitUrl}
                          onChange={(e) => setGitUrl(e.target.value)}
                          className="border-white/5 bg-zinc-950 text-white placeholder:text-zinc-600 focus-visible:ring-blue-500/50"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="upload" className="mt-0 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="file-upload" className="text-xs font-semibold text-zinc-400">Project Archive</Label>
                        <div className="relative group">
                          <Input
                            id="file-upload"
                            type="file"
                            accept=".zip,.tar.gz,.tgz"
                            onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                            className="h-auto py-8 px-4 border-dashed border-white/10 bg-zinc-950 text-zinc-400 hover:bg-zinc-900 transition-colors cursor-pointer file:hidden text-center"
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-zinc-500 group-hover:text-zinc-400">
                            <Upload className="h-6 w-6 mb-2 opacity-50" />
                            <p className="text-xs">
                              {uploadFile ? uploadFile.name : "Select .zip or .tar.gz"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {formError && (
                      <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">{formError}</AlertDescription>
                      </Alert>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 py-6 text-base font-semibold"
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Deploying...
                        </span>
                      ) : (
                        "Deploy Service"
                      )}
                    </Button>
                  </form>
                </Tabs>
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-2 border-t border-white/5 bg-white/[0.01] px-6 py-4 text-[11px] text-zinc-500">
                <div className="flex items-center gap-2">
                  <Terminal className="h-3 w-3" />
                  <span>Your service will be assigned a unique subdomain.</span>
                </div>
              </CardFooter>
            </Card>

            <div className="rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-600/5 border border-white/5 p-6">
              <h4 className="text-sm font-semibold text-white mb-2">Need help?</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Check our documentation to learn how to optimize your builds and manage environmental variables.
              </p>
              <Button variant="link" className="px-0 h-auto text-xs text-blue-400 hover:text-blue-300 mt-4">
                View Documentation →
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

interface CardProps {
  deployment: Deployment;
  logsOpen: boolean;
  onToggleLogs: () => void;
  onDelete: () => void;
}

function DeploymentCard({ deployment, logsOpen, onToggleLogs, onDelete }: CardProps) {
  const liveUrl = getDeploymentUrl(deployment);

  return (
    <Card className={cn(
      "overflow-hidden border-white/5 bg-zinc-900/40 transition-all hover:bg-zinc-900/60 shadow-lg",
      logsOpen && "ring-1 ring-blue-500/30"
    )}>
      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-950 border border-white/5">
              <Box className="h-6 w-6 text-zinc-400" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-3">
                <h3 className="truncate font-mono text-sm font-bold text-white tracking-tight">
                  {deployment.name}
                </h3>
                <StatusBadge status={deployment.status} />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {new Date(deployment.created_at).toLocaleTimeString()}
                </span>
                {deployment.image_tag && (
                  <span className="flex items-center gap-1.5 bg-zinc-950 px-2 py-0.5 rounded border border-white/5 font-mono text-zinc-400">
                    <Terminal className="h-3 w-3" />
                    {deployment.image_tag}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            {liveUrl && (
              <a 
                href={liveUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-8 border-white/5 bg-zinc-950 text-blue-400 hover:bg-zinc-900 hover:text-blue-300 gap-2 text-xs px-3"
                )}
              >
                <ExternalLink className="h-3 w-3" />
                Visit
              </a>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onToggleLogs}
              className={cn(
                "h-8 border-white/5 bg-zinc-950 text-zinc-400 hover:bg-zinc-900 hover:text-white text-xs",
                logsOpen && "bg-zinc-900 text-white"
              )}
            >
              {logsOpen ? "Hide logs" : "Show logs"}
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1 bg-white/5 hidden sm:block" />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDelete}
              className="h-8 w-8 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {logsOpen && (
        <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-200">
          <LogViewer deployment={deployment} />
        </div>
      )}
    </Card>
  );
}
