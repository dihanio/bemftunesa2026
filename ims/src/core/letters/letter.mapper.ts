import { LetterDTO } from './letter.dto';
import { LetterData, LetterStatus, LetterType } from '../../types/letter';

export function mapLetterDtoToDomain(dto: LetterDTO): LetterData {
  let status: LetterStatus = 'draft';
  const validStatuses = ['draft', 'review_kadep', 'review_ketua', 'approved', 'rejected', 'archived'];
  if (validStatuses.includes(dto.status)) {
    status = dto.status as LetterStatus;
  }
  
  let type: LetterType = 'outgoing';
  const validTypes = ['incoming', 'outgoing', 'proposal', 'lpj'];
  if (validTypes.includes(dto.type)) {
    type = dto.type as LetterType;
  }
  
  return {
    id: dto._id,
    referenceNumber: dto.referenceNumber,
    subject: dto.subject,
    type,
    status,
    createdAt: dto.createdAt,
    sender: dto.sender,
    recipient: dto.recipient,
    department: dto.department ? {
      id: dto.department._id,
      name: dto.department.name,
      code: dto.department.code
    } : undefined,
    createdBy: {
      id: dto.createdBy?._id || 'unknown',
      name: dto.createdBy?.name || 'Unknown'
    },
    documentUrl: dto.documentUrl,
    approvalNotes: dto.approvalNotes,
    dateApproved: dto.dateApproved,
    deadlineDate: dto.deadlineDate,
    impactScale: dto.impactScale,
    urgencyLevel: dto.urgencyLevel,
    smartScore: dto.smartScore
  };
}
