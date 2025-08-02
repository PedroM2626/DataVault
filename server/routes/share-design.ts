import { RequestHandler } from "express";
import { randomBytes } from "crypto";

// In-memory storage for shared designs
// In production, use a proper database
const sharedDesigns = new Map<string, any>();

export const handleShareDesign: RequestHandler = (req, res) => {
  try {
    const { data, columns, viewMode, timestamp } = req.body;
    
    if (!data || !columns) {
      return res.status(400).json({ error: 'Data and columns are required' });
    }
    
    // Generate unique share ID
    const shareId = randomBytes(16).toString('hex');
    
    // Store the design
    const designData = {
      id: shareId,
      data,
      columns,
      viewMode: viewMode || 'table',
      timestamp: timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      accessCount: 0
    };
    
    sharedDesigns.set(shareId, designData);
    
    // Create share URL
    const baseUrl = req.get('origin') || `${req.protocol}://${req.get('host')}`;
    const shareUrl = `${baseUrl}/shared/${shareId}`;
    
    res.json({
      message: 'Design shared successfully',
      shareId,
      shareUrl,
      expiresAt: null, // No expiration for now
      createdAt: designData.createdAt
    });
  } catch (error) {
    console.error('Share design error:', error);
    res.status(500).json({ 
      error: 'Failed to create share link' 
    });
  }
};

// Route to access shared designs
export const handleGetSharedDesign: RequestHandler = (req, res) => {
  try {
    const { shareId } = req.params;
    
    const design = sharedDesigns.get(shareId);
    if (!design) {
      return res.status(404).json({ error: 'Shared design not found' });
    }
    
    // Increment access count
    design.accessCount += 1;
    sharedDesigns.set(shareId, design);
    
    res.json({
      ...design,
      message: 'Shared design retrieved successfully'
    });
  } catch (error) {
    console.error('Get shared design error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve shared design' 
    });
  }
};
