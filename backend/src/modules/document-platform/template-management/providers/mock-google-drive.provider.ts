import { Injectable } from '@nestjs/common';
import { TemplateSourceContent, TemplateSourceProvider } from './template-source-provider.interface';

@Injectable()
export class MockGoogleDriveProvider implements TemplateSourceProvider {
  getProviderName(): string {
    return 'google-drive-mock';
  }

  async fetchContent(sourceIdOrUrl: string): Promise<TemplateSourceContent> {
    // In a real implementation, this would use the Google Drive API to fetch the file,
    // export it as HTML, and clean up the HTML structure.
    
    // For the mock, we simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return some mock HTML with placeholders
    const mockHtml = `
      <div style="font-family: Arial, sans-serif; padding: 40px; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2>KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI</h2>
          <h3>UNIVERSITAS NEGERI SURABAYA</h3>
          <h4>BADAN EKSEKUTIF MAHASISWA FAKULTAS TEKNIK</h4>
        </div>
        <hr style="border: 1px solid black; margin-bottom: 2px;" />
        <hr style="border: 2px solid black; margin-bottom: 30px;" />
        
        <table style="width: 100%; margin-bottom: 20px;">
          <tr>
            <td style="width: 15%;">Nomor</td>
            <td style="width: 5%;">:</td>
            <td>{{NOMOR_SURAT}}</td>
            <td style="text-align: right;">Surabaya, {{TANGGAL_SURAT}}</td>
          </tr>
          <tr>
            <td>Lampiran</td>
            <td>:</td>
            <td colspan="2">{{LAMPIRAN}}</td>
          </tr>
          <tr>
            <td>Hal</td>
            <td>:</td>
            <td colspan="2"><b>{{PERIHAL}}</b></td>
          </tr>
        </table>

        <div style="margin-bottom: 20px;">
          <p>Yth. {{PENERIMA}}</p>
          <p>di {{TEMPAT_PENERIMA}}</p>
        </div>

        <div style="margin-bottom: 20px; text-align: justify;">
          <p>Dengan hormat,</p>
          <p>{{PARAGRAF_PEMBUKA}}</p>
          <p>Sehubungan dengan akan dilaksanakannya kegiatan <b>{{NAMA_KEGIATAN}}</b> yang diselenggarakan oleh BEM FT UNESA, kami memohon kehadiran Bapak/Ibu/Saudara/i pada:</p>
          <table style="margin-left: 30px; margin-top: 10px; margin-bottom: 10px;">
            <tr>
              <td style="width: 120px;">Hari, Tanggal</td>
              <td style="width: 10px;">:</td>
              <td>{{TANGGAL_KEGIATAN}}</td>
            </tr>
            <tr>
              <td>Waktu</td>
              <td>:</td>
              <td>{{WAKTU_KEGIATAN}}</td>
            </tr>
            <tr>
              <td>Tempat</td>
              <td>:</td>
              <td>{{TEMPAT_KEGIATAN}}</td>
            </tr>
          </table>
          <p>{{PARAGRAF_PENUTUP}}</p>
          <p>Demikian surat permohonan ini kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.</p>
        </div>

        <div style="float: right; text-align: center; width: 300px; margin-top: 40px;">
          <p>Mengetahui,</p>
          <p>Ketua BEM FT UNESA</p>
          <br /><br /><br />
          <p><b>{{NAMA_KABEM}}</b></p>
          <p>NIM. {{NIM_KABEM}}</p>
        </div>
        <div style="clear: both;"></div>
      </div>
    `;

    return {
      htmlContent: mockHtml,
      sourceType: 'HTML',
      metadata: {
        originalSource: sourceIdOrUrl,
        fetchedAt: new Date().toISOString(),
      }
    };
  }
}
