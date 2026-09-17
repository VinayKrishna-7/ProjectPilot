import { Label, ILabelDocument } from '../models/Label';
import { AppError } from '../utils/AppError';

export class LabelService {
  async getLabels(projectId: string): Promise<ILabelDocument[]> {
    return Label.find({ project: projectId }).sort({ name: 1 });
  }

  async createLabel(projectId: string, name: string, color: string): Promise<ILabelDocument> {
    const existing = await Label.findOne({ project: projectId, name });
    if (existing) throw new AppError('Label with this name already exists', 409, 'LABEL_EXISTS');
    return Label.create({ project: projectId, name, color });
  }

  async updateLabel(labelId: string, name?: string, color?: string): Promise<ILabelDocument> {
    const label = await Label.findByIdAndUpdate(
      labelId,
      { $set: { ...(name && { name }), ...(color && { color }) } },
      { new: true }
    );
    if (!label) throw new AppError('Label not found', 404, 'LABEL_NOT_FOUND');
    return label;
  }

  async deleteLabel(labelId: string): Promise<void> {
    const label = await Label.findByIdAndDelete(labelId);
    if (!label) throw new AppError('Label not found', 404, 'LABEL_NOT_FOUND');
  }
}

export const labelService = new LabelService();
