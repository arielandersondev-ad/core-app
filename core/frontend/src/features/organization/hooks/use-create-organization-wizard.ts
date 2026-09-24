"use client";

import { useCallback, useState } from "react";
import {
  initialOrganizationSetup,
  type BranchFormValues,
  type OrganizationFormValues,
  type OrganizationSetupPayload,
  type RoleFormValues,
} from "../types/organization-setup";

export function useCreateOrganizationWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OrganizationSetupPayload>(initialOrganizationSetup);

  const saveOrganization = useCallback((organization: OrganizationFormValues) => {
    setData((current) => ({ ...current, organization }));
    setCurrentStep(1);
  }, []);

  const addRole = useCallback((role: RoleFormValues) => {
    setData((current) => ({ ...current, roles: [...current.roles, role] }));
  }, []);

  const removeRole = useCallback((indexToRemove: number) => {
    setData((current) => ({
      ...current,
      roles: current.roles.filter((_, index) => index !== indexToRemove),
    }));
  }, []);

  const addBranch = useCallback((branch: BranchFormValues) => {
    setData((current) => ({ ...current, branches: [...current.branches, branch] }));
  }, []);

  const removeBranch = useCallback((indexToRemove: number) => {
    setData((current) => ({
      ...current,
      branches: current.branches.filter((_, index) => index !== indexToRemove),
    }));
  }, []);

  const goBack = useCallback(() => {
    setCurrentStep((step) => Math.max(0, step - 1));
  }, []);

  const goToBranches = useCallback(() => {
    setCurrentStep(2);
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setData({
      organization: { ...initialOrganizationSetup.organization },
      roles: [],
      branches: [],
    });
  }, []);

  return {
    currentStep,
    data,
    saveOrganization,
    addRole,
    removeRole,
    addBranch,
    removeBranch,
    goBack,
    goToBranches,
    reset,
  };
}
