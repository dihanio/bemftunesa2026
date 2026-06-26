export class CreateCabinetPeriodDto {
  name: string;
  year: string;
  startDate: string;
  endDate: string;
  status?: string;
}

export class UpdateCabinetPeriodDto {
  name?: string;
  year?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export class QueryCabinetPeriodDto {
  status?: string;
}
