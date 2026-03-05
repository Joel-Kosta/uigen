"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getProject(projectId: string) {
  const session = await getSession();
  
  if (!session) {
    throw new Error("Unauthorized");
  }

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
      userId: session.userId,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  return {
    id: project.id,
    name: project.name,
messages: JSON.parse(project.messages).filter((m) => { if (typeof m.content === "string") return m.content.trim() !== ""; if (Array.isArray(m.content)) { return m.content.every((block) => block.type !== "text" || block.text.trim() !== ""); } return true; }),    data: JSON.parse(project.data),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}
