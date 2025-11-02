/**
 * Whiteboard Service - Handles whiteboard data persistence with Supabase
 */

import { supabase } from '../lib/supabase';

/**
 * Get or create whiteboard session for a chat
 */
export async function getOrCreateWhiteboardSession(userId, chatSessionId) {
  try {
    // Try to get existing session
    const { data: existing, error: fetchError } = await supabase
      .from('whiteboard_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('chat_session_id', chatSessionId)
      .single();

    if (existing) {
      return { data: existing, error: null };
    }

    // Create new session if doesn't exist
    const { data, error } = await supabase
      .from('whiteboard_sessions')
      .insert({
        user_id: userId,
        chat_session_id: chatSessionId
      })
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error getting/creating whiteboard session:', error);
    return { data: null, error };
  }
}

/**
 * Load all whiteboard content for a session
 */
export async function loadWhiteboardContent(whiteboardSessionId) {
  try {
    const { data, error } = await supabase
      .from('whiteboard_content')
      .select('*')
      .eq('whiteboard_session_id', whiteboardSessionId)
      .order('created_at', { ascending: true });

    return { data, error };
  } catch (error) {
    console.error('Error loading whiteboard content:', error);
    return { data: null, error };
  }
}

/**
 * Save a new diagram or drawing to whiteboard
 */
export async function saveWhiteboardContent(whiteboardSessionId, content) {
  try {
    const { data, error } = await supabase
      .from('whiteboard_content')
      .insert({
        whiteboard_session_id: whiteboardSessionId,
        content_type: content.contentType,
        diagram_type: content.diagramType,
        question: content.question,
        ai_response: content.aiResponse,
        canvas_data: content.canvasData,
        elements: content.elements,
        position_y: content.positionY,
        height: content.height
      })
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error saving whiteboard content:', error);
    return { data: null, error };
  }
}

/**
 * Update existing whiteboard content (for manual edits)
 */
export async function updateWhiteboardContent(contentId, updates) {
  try {
    const { data, error } = await supabase
      .from('whiteboard_content')
      .update({
        canvas_data: updates.canvasData,
        updated_at: new Date().toISOString()
      })
      .eq('id', contentId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error updating whiteboard content:', error);
    return { data: null, error };
  }
}

/**
 * Delete whiteboard content entry
 */
export async function deleteWhiteboardContent(contentId) {
  try {
    const { error } = await supabase
      .from('whiteboard_content')
      .delete()
      .eq('id', contentId);

    return { error };
  } catch (error) {
    console.error('Error deleting whiteboard content:', error);
    return { error };
  }
}

/**
 * Clear all content from a whiteboard session
 */
export async function clearWhiteboardSession(whiteboardSessionId) {
  try {
    const { error } = await supabase
      .from('whiteboard_content')
      .delete()
      .eq('whiteboard_session_id', whiteboardSessionId);

    return { error };
  } catch (error) {
    console.error('Error clearing whiteboard session:', error);
    return { error };
  }
}
