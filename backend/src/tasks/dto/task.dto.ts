export class CreateTaskDto {
  cabinetPeriod: string;
  department: string;
  program?: string;
  title: string;
  description?: string;
  assignees?: string[];
  deadline?: string;
  priority?: string;
  status?: string;
}

export class UpdateTaskDto {
  title?: string;
  description?: string;
  assignees?: string[];
  deadline?: string;
  priority?: string;
  status?: string;
}

export class QueryTaskDto {
  department?: string;
  status?: string;
  assignee?: string;
  cabinetPeriod?: string;
  program?: string;
}
