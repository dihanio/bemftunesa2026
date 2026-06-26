export class CreateProgramDto {
  cabinetPeriod: string;
  department: string;
  title: string;
  category?: string;
  description?: string;
  pic?: string;
  status?: string;
  targetOutput?: string;
  startDate?: string;
  endDate?: string;
  estimatedBudget?: number;
  fundingStatus?: string;
}

export class UpdateProgramDto {
  title?: string;
  category?: string;
  description?: string;
  pic?: string;
  status?: string;
  progress?: number;
  targetOutput?: string;
  startDate?: string;
  endDate?: string;
  estimatedBudget?: number;
  fundingStatus?: string;
  tor?: string;
  proposal?: string;
  lpj?: string;
  evaluationNotes?: string;
}

export class QueryProgramDto {
  department?: string;
  status?: string;
  cabinetPeriod?: string;
}
