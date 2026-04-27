import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDeployments,
  deleteDeployment,
  type Deployment,
} from "../lib/api";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Box
} from "lucide-react";
import { DeploymentCard } from "~/components/deployment-card";
import { DeploymentForm } from "~/components/deployment-form";
import { Header } from "~/components/header";

export default function Home() {
  const queryClient = useQueryClient();

  const [openLogsId, setOpenLogsId] = useState<string | null>(null);

  const { data: deployments = [], isLoading } = useQuery({
    queryKey: ["deployments"],
    queryFn: fetchDeployments,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDeployment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Header */}
      <Header />

      <main className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/*  Left Column: Deployments List*/}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Deployments</h2>
                <p className="text-sm text-muted-foreground">Manage and monitor your running services</p>
              </div>
              <Badge variant="secondary" className="border-border bg-card">{deployments.length} Active</Badge>
            </div>

            {isLoading ? (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-border bg-card/40">
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
                  <p className="text-sm font-medium">Fetching deployments...</p>
                </div>
              </div>
            ) : deployments.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
                  <Box className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">No deployments yet</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                  Your services will appear here once you&apos;ve deployed them. Start by connecting a repository.
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

          {/* Right Column: Deploy Form */}
          <div className="space-y-6">
            <DeploymentForm onCreated={(deployment) => setOpenLogsId(deployment.id)} />
          </div>
        </div>
      </main>
    </div>
  );
}
