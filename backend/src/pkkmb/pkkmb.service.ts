import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PKKMBParticipant,
  PKKMBTask,
  PKKMBSubmission,
  PKKMBAnnouncement,
  PKKMBSchedule,
  PKKMBGallery,
} from '../database/schema/pkkmb';

@Injectable()
export class PkkmbService {
  constructor(
    @InjectModel(PKKMBParticipant.name)
    private participantModel: Model<PKKMBParticipant>,
    @InjectModel(PKKMBTask.name) private taskModel: Model<PKKMBTask>,
    @InjectModel(PKKMBSubmission.name)
    private submissionModel: Model<PKKMBSubmission>,
    @InjectModel(PKKMBAnnouncement.name)
    private announcementModel: Model<PKKMBAnnouncement>,
    @InjectModel(PKKMBSchedule.name)
    private scheduleModel: Model<PKKMBSchedule>,
    @InjectModel(PKKMBGallery.name) private galleryModel: Model<PKKMBGallery>,
  ) {}

  async authParticipant(nim: string) {
    const participant = await this.participantModel.findOne({ nim });
    if (!participant)
      throw new UnauthorizedException(
        'NIM tidak terdaftar sebagai peserta PKKMB',
      );
    return {
      data: {
        id: participant._id,
        nim: participant.nim,
        name: participant.name,
        group: participant.group,
      },
    };
  }

  async getSchedule() {
    const schedule = await this.scheduleModel
      .find()
      .sort({ day: 1, startTime: 1 });
    return { data: schedule };
  }

  async listTasks() {
    const tasks = await this.taskModel
      .find({ deletedAt: null })
      .sort({ deadline: 1 });
    return { data: tasks };
  }

  async getTask(id: string) {
    const task = await this.taskModel.findOne({ _id: id, deletedAt: null });
    if (!task) throw new NotFoundException('Tugas tidak ditemukan');
    return { data: task };
  }

  async submitTask(taskId: string, data: any) {
    // data should include participantId from the client-side auth
    const submission = await this.submissionModel.create({
      taskId,
      ...data,
      status: 'Submitted',
    });
    return { data: submission, message: 'Tugas berhasil dikumpulkan' };
  }

  async listAnnouncements() {
    const announcements = await this.announcementModel
      .find({ deletedAt: null })
      .sort({ createdAt: -1 });
    return { data: announcements };
  }

  async getGallery() {
    const gallery = await this.galleryModel.find().sort({ createdAt: -1 });
    return { data: gallery };
  }

  async createTask(data: any) {
    const task = await this.taskModel.create(data);
    return { data: task, message: 'Tugas berhasil dibuat' };
  }

  async createAnnouncement(data: any) {
    const announcement = await this.announcementModel.create(data);
    return { data: announcement, message: 'Pengumuman berhasil dibuat' };
  }

  async gradeSubmission(id: string, data: any) {
    const submission = await this.submissionModel.findByIdAndUpdate(
      id,
      {
        $set: { score: data.score, feedback: data.feedback, status: 'Graded' },
      },
      { new: true },
    );
    if (!submission) throw new NotFoundException('Submission tidak ditemukan');
    return { data: submission, message: 'Submission berhasil dinilai' };
  }
}
