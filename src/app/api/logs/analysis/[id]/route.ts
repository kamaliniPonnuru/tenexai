import { NextRequest, NextResponse } from 'next/server';
import { LogAnalysisModel } from '@/lib/models/logAnalysis';
import { AIAnalysisService } from '@/lib/services/aiAnalysis';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const fileId = parseInt(params.id);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Get analysis results
    const analysis = await LogAnalysisModel.getAnalysis(fileId, parseInt(userId));

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    // Get sample log entries
    const logEntries = await LogAnalysisModel.getLogEntries(analysis.filename, parseInt(userId), 50);

    // Enhance analysis with AI insights if available
    let aiInsights = null;
    let executiveSummary = null;
    
    try {
      if (logEntries.length > 0) {
        // Convert log entries to AI service format
        const aiLogEntries = logEntries.map(entry => ({
          timestamp: entry.timestamp.toISOString(),
          source_ip: entry.source_ip,
          destination_ip: entry.destination_ip,
          url: entry.url,
          action: entry.action,
          status_code: entry.status_code,
          user_agent: entry.user_agent,
          threat_category: entry.threat_category,
          severity: entry.severity
        }));

        aiInsights = await AIAnalysisService.analyzeLogsWithAI(aiLogEntries);
        executiveSummary = await AIAnalysisService.generateExecutiveSummary(aiLogEntries);
      }
    } catch (aiError) {
      console.error('AI analysis failed:', aiError);
      // Continue without AI insights
    }

    return NextResponse.json({
      analysis: {
        id: analysis.id,
        filename: analysis.filename,
        log_type: analysis.log_type,
        total_entries: analysis.total_entries,
        time_range: analysis.time_range,
        threat_summary: analysis.threat_summary,
        top_sources: analysis.top_sources,
        top_destinations: analysis.top_destinations,
        threat_categories: analysis.threat_categories,
        severity_distribution: analysis.severity_distribution,
        created_at: analysis.created_at
      },
      sample_entries: logEntries.map(entry => ({
        id: entry.id,
        timestamp: entry.timestamp,
        source_ip: entry.source_ip,
        destination_ip: entry.destination_ip,
        url: entry.url,
        action: entry.action,
        status_code: entry.status_code,
        threat_category: entry.threat_category,
        severity: entry.severity
      })),
      ai_insights: aiInsights,
      executive_summary: executiveSummary,
      ai_available: aiInsights !== null
    });

  } catch (error) {
    console.error('Error fetching analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const fileId = parseInt(params.id);
    const { action } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (action === 'regenerate_ai_analysis') {
      // Get analysis from database
      const analysis = await LogAnalysisModel.getAnalysis(fileId, parseInt(userId));

      if (!analysis) {
        return NextResponse.json(
          { error: 'Analysis not found' },
          { status: 404 }
        );
      }

      // Get log entries for AI analysis
      const logEntries = await LogAnalysisModel.getLogEntries(analysis.filename, parseInt(userId), 100);

      if (logEntries.length === 0) {
        return NextResponse.json(
          { error: 'No log entries available for AI analysis' },
          { status: 400 }
        );
      }

      // Convert log entries to AI service format
      const aiLogEntries = logEntries.map(entry => ({
        timestamp: entry.timestamp.toISOString(),
        source_ip: entry.source_ip,
        destination_ip: entry.destination_ip,
        url: entry.url,
        action: entry.action,
        status_code: entry.status_code,
        user_agent: entry.user_agent,
        threat_category: entry.threat_category,
        severity: entry.severity
      }));

      // Generate new AI analysis
      const aiInsights = await AIAnalysisService.analyzeLogsWithAI(aiLogEntries);
      const executiveSummary = await AIAnalysisService.generateExecutiveSummary(aiLogEntries);

      return NextResponse.json({
        success: true,
        aiInsights,
        executiveSummary
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error processing AI analysis request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 