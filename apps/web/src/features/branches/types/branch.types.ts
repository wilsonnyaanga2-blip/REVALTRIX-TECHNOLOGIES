export interface BranchOrganization {
  id: string;
  name: string;
  code: string;
}

export interface BranchDepartment {
  id: string;
  name: string;
  code: string;
  status: string;
}

export interface BranchCounts {
  departments: number;
  memberships: number;
  services: number;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  status: string;
  organizationId: string | null;
  organization?: BranchOrganization | null;
  departments?: BranchDepartment[];
  _count?: BranchCounts;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchInput {
  name: string;
  code: string;
  organizationId?: string;
}

export interface UpdateBranchInput {
  name?: string;
  code?: string;
  organizationId?: string | null;
}
