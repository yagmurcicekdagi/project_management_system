import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignEmployee,
  getAssignments,
  unassignAll,
  unassignEmployee,
} from "../../api/assignments";

export function useProjectAssignments(projectId: number) {
  return useQuery({
    queryKey: ["assignments", projectId],
    queryFn: () => getAssignments(projectId),
    enabled: !!projectId,
  });
}

export function useAssignEmployee(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (employeeId: number) => assignEmployee(projectId, employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments", projectId] });
    },
  });
}

export function useUnassignEmployee(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (employeeId: number) => unassignEmployee(projectId, employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments", projectId] });
    },
  });
}

export function useUnassignAll(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unassignAll(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments", projectId] });
    },
  });
}
