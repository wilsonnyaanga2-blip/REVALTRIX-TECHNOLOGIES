export interface CreateServiceDto {
  name: string;
  code: string;
  description?: string;
  category?: string;
  durationMin?: number;
  departmentId?: string;
  branchId?: string;
}

export interface UpdateServiceDto {
  name?: string;
  code?: string;
  description?: string;
  category?: string;
  durationMin?: number;
  departmentId?: string | null;
  branchId?: string | null;
}
