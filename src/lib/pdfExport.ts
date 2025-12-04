import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  calculateMean, 
  findSupremum, 
  findInfimum, 
  simpleIntegration,
  calculateZScore,
  calculateStdDev,
  calculateVariance
} from './realNumberMath';

interface StudySession {
  id: string;
  duration_minutes: number;
  duration_hours: number;
  mood_score: number;
  focus_score: number;
  efficiency_score: number;
  notes: string | null;
  created_at: string;
  week_start: string;
}

export const generateStudyPDF = async (
  sessions: StudySession[],
  chartRef: HTMLElement | null,
  recommendations: string
) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Colors
  const primaryColor: [number, number, number] = [59, 130, 246]; // blue
  const textColor: [number, number, number] = [31, 41, 55];
  const mutedColor: [number, number, number] = [107, 114, 128];

  // Helper function to add text
  const addText = (text: string, x: number, y: number, options?: { 
    fontSize?: number; 
    color?: [number, number, number]; 
    fontStyle?: 'normal' | 'bold' | 'italic';
    align?: 'left' | 'center' | 'right';
  }) => {
    const { fontSize = 10, color = textColor, fontStyle = 'normal', align = 'left' } = options || {};
    pdf.setFontSize(fontSize);
    pdf.setTextColor(...color);
    pdf.setFont('helvetica', fontStyle);
    
    let xPos = x;
    if (align === 'center') {
      xPos = pageWidth / 2;
    } else if (align === 'right') {
      xPos = pageWidth - margin;
    }
    
    pdf.text(text, xPos, y, { align });
    return y + (fontSize * 0.4);
  };

  // Header
  pdf.setFillColor(...primaryColor);
  pdf.rect(0, 0, pageWidth, 35, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Laporan Analisis Belajar', margin, 20);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Dibuat: ${new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, margin, 28);

  yPos = 45;

  // Calculate statistics
  const durations = sessions.map(s => s.duration_hours);
  const efficiencies = sessions.map(s => s.efficiency_score);
  const moods = sessions.map(s => s.mood_score);
  const focuses = sessions.map(s => s.focus_score);

  const stats = {
    totalHours: simpleIntegration(durations, 1),
    avgDuration: calculateMean(durations),
    supDuration: findSupremum(durations),
    infDuration: findInfimum(durations),
    avgEfficiency: calculateMean(efficiencies),
    avgMood: calculateMean(moods),
    avgFocus: calculateMean(focuses),
    variance: calculateVariance(durations),
    stdDev: calculateStdDev(durations),
    zScoreLatest: sessions.length > 0 
      ? calculateZScore(durations[durations.length - 1], calculateMean(durations), calculateStdDev(durations))
      : 0
  };

  // Statistics Section
  yPos = addText('📊 Ringkasan Statistik Bilangan Real', margin, yPos, { 
    fontSize: 14, 
    fontStyle: 'bold',
    color: primaryColor 
  });
  yPos += 5;

  // Draw stats table
  const statsData = [
    ['Metrik', 'Nilai', 'Rumus'],
    ['Total Waktu Belajar', `${stats.totalHours.toFixed(2)} jam`, 'Σ(xi)'],
    ['Rata-rata Durasi (μ)', `${stats.avgDuration.toFixed(4)} jam`, 'Σ(xi) / n'],
    ['Supremum (sup)', `${stats.supDuration.toFixed(2)} jam`, 'max{xi}'],
    ['Infimum (inf)', `${stats.infDuration.toFixed(2)} jam`, 'min{xi}'],
    ['Variansi (σ²)', `${stats.variance.toFixed(4)}`, 'Σ(xi - μ)² / n'],
    ['Standar Deviasi (σ)', `${stats.stdDev.toFixed(4)}`, '√σ²'],
    ['Z-Score Terbaru', `${stats.zScoreLatest.toFixed(4)}`, '(x - μ) / σ'],
    ['Efisiensi Rata-rata', `${(stats.avgEfficiency * 100).toFixed(1)}%`, 'μ(ε) × 100'],
    ['Mood Rata-rata', `${(stats.avgMood * 100).toFixed(1)}%`, 'μ(m) × 100'],
    ['Fokus Rata-rata', `${(stats.avgFocus * 100).toFixed(1)}%`, 'μ(f) × 100'],
  ];

  // Table styling
  const colWidths = [60, 50, 50];
  const rowHeight = 7;
  let tableX = margin;

  statsData.forEach((row, rowIndex) => {
    const isHeader = rowIndex === 0;
    
    if (isHeader) {
      pdf.setFillColor(240, 240, 240);
      pdf.rect(tableX, yPos - 4, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
    }
    
    row.forEach((cell, colIndex) => {
      pdf.setFontSize(isHeader ? 9 : 8);
      pdf.setFont('helvetica', isHeader ? 'bold' : 'normal');
      pdf.setTextColor(...(isHeader ? primaryColor : textColor));
      pdf.text(cell, tableX + colWidths.slice(0, colIndex).reduce((a, b) => a + b, 0) + 2, yPos);
    });
    
    yPos += rowHeight;
  });

  yPos += 10;

  // Chart Section
  if (chartRef) {
    yPos = addText('📈 Grafik Progress Belajar', margin, yPos, { 
      fontSize: 14, 
      fontStyle: 'bold',
      color: primaryColor 
    });
    yPos += 5;

    try {
      const canvas = await html2canvas(chartRef, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Check if chart fits on current page
      if (yPos + imgHeight > pageHeight - margin) {
        pdf.addPage();
        yPos = margin;
      }
      
      pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
      yPos += imgHeight + 10;
    } catch (error) {
      console.error('Error capturing chart:', error);
    }
  }

  // Data Table Section
  if (yPos + 50 > pageHeight - margin) {
    pdf.addPage();
    yPos = margin;
  }

  yPos = addText('📋 Data Sesi Belajar', margin, yPos, { 
    fontSize: 14, 
    fontStyle: 'bold',
    color: primaryColor 
  });
  yPos += 5;

  // Session table headers
  const sessionHeaders = ['Tanggal', 'Durasi', 'Efisiensi', 'Mood', 'Fokus'];
  const sessionColWidths = [40, 30, 30, 30, 30];
  
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, yPos - 4, sessionColWidths.reduce((a, b) => a + b, 0), 7, 'F');
  
  sessionHeaders.forEach((header, i) => {
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...primaryColor);
    pdf.text(header, margin + sessionColWidths.slice(0, i).reduce((a, b) => a + b, 0) + 2, yPos);
  });
  yPos += 7;

  // Session data (last 10 sessions)
  const recentSessions = sessions.slice(-10);
  recentSessions.forEach((session) => {
    if (yPos + 7 > pageHeight - margin) {
      pdf.addPage();
      yPos = margin;
    }

    const rowData = [
      new Date(session.created_at).toLocaleDateString('id-ID'),
      `${session.duration_hours.toFixed(2)} jam`,
      `${(session.efficiency_score * 100).toFixed(0)}%`,
      `${(session.mood_score * 100).toFixed(0)}%`,
      `${(session.focus_score * 100).toFixed(0)}%`,
    ];

    rowData.forEach((cell, i) => {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...textColor);
      pdf.text(cell, margin + sessionColWidths.slice(0, i).reduce((a, b) => a + b, 0) + 2, yPos);
    });
    yPos += 6;
  });

  yPos += 10;

  // AI Recommendations Section
  if (recommendations) {
    if (yPos + 40 > pageHeight - margin) {
      pdf.addPage();
      yPos = margin;
    }

    yPos = addText('🤖 Rekomendasi AI', margin, yPos, { 
      fontSize: 14, 
      fontStyle: 'bold',
      color: primaryColor 
    });
    yPos += 5;

    // Split recommendations into lines
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...textColor);
    
    const maxWidth = pageWidth - (margin * 2);
    const lines = pdf.splitTextToSize(recommendations, maxWidth);
    
    lines.forEach((line: string) => {
      if (yPos + 5 > pageHeight - margin) {
        pdf.addPage();
        yPos = margin;
      }
      pdf.text(line, margin, yPos);
      yPos += 5;
    });
  }

  // Footer
  const pageCount = pdf.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(...mutedColor);
    pdf.text(
      `Halaman ${i} dari ${pageCount} | Dibuat dengan Analisis Belajar App`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save PDF
  const fileName = `laporan-belajar-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
  
  return fileName;
};
