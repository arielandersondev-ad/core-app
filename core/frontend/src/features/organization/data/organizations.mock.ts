import { organizations as platformOrganizations } from "@/shared/data/platform.mock";
import type { Organization } from "../types/organization";

export const organizations =
  platformOrganizations satisfies readonly Organization[];
