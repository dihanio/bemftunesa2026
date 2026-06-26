export class CreateMeetingDto {
  cabinetPeriod: string;
  department: string;
  title: string;
  date: string;
  location?: string;
  attendees?: string[];
  minutes?: string;
  attachments?: string[];
  actionItems?: string[];
}

export class UpdateMeetingDto {
  title?: string;
  date?: string;
  location?: string;
  attendees?: string[];
  minutes?: string;
  attachments?: string[];
  actionItems?: string[];
}

export class QueryMeetingDto {
  department?: string;
  cabinetPeriod?: string;
}
