import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { firebaseRealtimeStorage as storage } from '../firebase-realtime-storage';
import type { PcBuild, InsertPcBuild } from '../../shared/schema';

interface BulkImportResult {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; error: string; data: any }>;
  warnings: Array<{ row: number; message: string; data: any }>;
}

interface BulkExportResult {
  success: boolean;
  filePath: string;
  recordCount: number;
  message: string;
}

interface InventoryRecord {
  id?: number;
  name: string;
  category: string;
  basePrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  description: string;
  processor: string;
  motherboard: string;
  ram: string;
  storage: string;
  gpu: string;
  casePsu: string;
  monitor?: string;
  keyboardMouse?: string;
  mousePad?: string;
  budgetRange: string;
  tags: string;
  isActive: boolean;
}

class BulkInventoryManager {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');
  private readonly exportsDir = path.join(process.cwd(), 'exports');

  constructor() {
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      await fs.mkdir(this.exportsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directories:', error);
    }
  }

  // Import inventory from CSV file
  async importFromCSV(filePath: string): Promise<BulkImportResult> {
    const result: BulkImportResult = {
      success: false,
      totalProcessed: 0,
      successCount: 0,
      errorCount: 0,
      errors: [],
      warnings: []
    };

    try {
      // Read and parse CSV file
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      result.totalProcessed = records.length;

      // Validate and process each record
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const rowNumber = i + 2; // +2 because CSV has header and is 1-indexed

        try {
          const validatedRecord = this.validateInventoryRecord(record, rowNumber);
          
          if (validatedRecord.warnings.length > 0) {
            result.warnings.push(...validatedRecord.warnings);
          }

          if (validatedRecord.isValid) {
            // Check if item exists (update) or create new
            let savedRecord;
            if (validatedRecord.data.id) {
              // Update existing
              savedRecord = await this.updateInventoryItem(validatedRecord.data);
            } else {
              // Create new
              savedRecord = await this.createInventoryItem(validatedRecord.data);
            }

            if (savedRecord) {
              result.successCount++;
            } else {
              throw new Error('Failed to save record to database');
            }
          } else {
            result.errorCount++;
          }

        } catch (error: any) {
          result.errors.push({
            row: rowNumber,
            error: error.message || 'Unknown error',
            data: record
          });
          result.errorCount++;
        }
      }

      result.success = result.errorCount === 0;
      
      // Generate import report
      await this.generateImportReport(result, filePath);

      return result;

    } catch (error: any) {
      console.error('Error importing CSV:', error);
      result.errors.push({
        row: 0,
        error: `File processing error: ${error.message}`,
        data: null
      });
      return result;
    }
  }

  // Export inventory to CSV file
  async exportToCSV(filters?: {
    category?: string;
    lowStockOnly?: boolean;
    includeInactive?: boolean;
  }): Promise<BulkExportResult> {
    try {
      // Get all PC builds
      let builds = await storage.getPcBuilds();

      // Apply filters
      if (filters) {
        if (filters.category) {
          builds = builds.filter(build => build.category === filters.category);
        }
        if (filters.lowStockOnly) {
          builds = builds.filter(build => build.stockQuantity <= (build.lowStockThreshold || 5));
        }
        if (!filters.includeInactive) {
          builds = builds.filter(build => build.isActive !== false);
        }
      }

      // Convert to CSV format
      const csvData = builds.map(build => ({
        id: build.id,
        name: build.name,
        category: build.category,
        basePrice: build.basePrice,
        stockQuantity: build.stockQuantity,
        lowStockThreshold: build.lowStockThreshold || 5,
        description: build.description,
        processor: build.processor,
        motherboard: build.motherboard,
        ram: build.ram,
        storage: build.storage,
        gpu: build.gpu,
        casePsu: build.casePsu,
        monitor: build.monitor || '',
        keyboardMouse: build.keyboardMouse || '',
        mousePad: build.mousePad || '',
        budgetRange: build.budgetRange,
        tags: '',
        isActive: build.isActive !== false,
        createdAt: build.createdAt,
        updatedAt: build.updatedAt
      }));

      // Generate CSV content
      const csvContent = stringify(csvData, {
        header: true,
        columns: [
          'id', 'name', 'category', 'basePrice', 'stockQuantity', 'lowStockThreshold',
          'description', 'processor', 'motherboard', 'ram', 'storage', 'gpu', 'casePsu',
          'monitor', 'keyboardMouse', 'mousePad', 'budgetRange', 'tags', 'isActive',
          'createdAt', 'updatedAt'
        ]
      });

      // Save to file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `inventory_export_${timestamp}.csv`;
      const filePath = path.join(this.exportsDir, fileName);
      
      await fs.writeFile(filePath, csvContent, 'utf-8');

      return {
        success: true,
        filePath,
        recordCount: builds.length,
        message: `Successfully exported ${builds.length} inventory items to ${fileName}`
      };

    } catch (error: any) {
      console.error('Error exporting CSV:', error);
      return {
        success: false,
        filePath: '',
        recordCount: 0,
        message: `Export failed: ${error.message}`
      };
    }
  }

  // Export template CSV for bulk import
  async exportTemplate(): Promise<BulkExportResult> {
    try {
      const templateData = [{
        id: '',
        name: 'Sample Gaming PC',
        category: 'Mid-Tier Creators & Gamers',
        basePrice: 75000,
        stockQuantity: 10,
        lowStockThreshold: 5,
        description: 'High-performance gaming PC for enthusiasts',
        processor: 'AMD Ryzen 5 5600X',
        motherboard: 'MSI B550M PRO-VDH WiFi',
        ram: '16GB DDR4 3200MHz',
        storage: '512GB NVMe SSD',
        gpu: 'RTX 3060 Ti 8GB',
        casePsu: 'Mid-Tower Case + 650W PSU',
        monitor: 'Optional - contact for pricing',
        keyboardMouse: 'Optional - contact for pricing',
        mousePad: 'Optional - contact for pricing',
        budgetRange: '₹70,000 - ₹80,000',
        tags: 'gaming;ryzen;rtx;ssd',
        isActive: true
      }];

      const csvContent = stringify(templateData, {
        header: true,
        columns: [
          'id', 'name', 'category', 'basePrice', 'stockQuantity', 'lowStockThreshold',
          'description', 'processor', 'motherboard', 'ram', 'storage', 'gpu', 'casePsu',
          'monitor', 'keyboardMouse', 'mousePad', 'budgetRange', 'tags', 'isActive'
        ]
      });

      const fileName = 'inventory_import_template.csv';
      const filePath = path.join(this.exportsDir, fileName);
      
      await fs.writeFile(filePath, csvContent, 'utf-8');

      return {
        success: true,
        filePath,
        recordCount: 1,
        message: `Template created successfully: ${fileName}`
      };

    } catch (error: any) {
      console.error('Error creating template:', error);
      return {
        success: false,
        filePath: '',
        recordCount: 0,
        message: `Template creation failed: ${error.message}`
      };
    }
  }

  // Validate inventory record
  private validateInventoryRecord(record: any, rowNumber: number): {
    isValid: boolean;
    data: InventoryRecord;
    errors: Array<{ row: number; error: string; data: any }>;
    warnings: Array<{ row: number; message: string; data: any }>;
  } {
    const errors: Array<{ row: number; error: string; data: any }> = [];
    const warnings: Array<{ row: number; message: string; data: any }> = [];

    // Required fields validation
    const requiredFields = ['name', 'category', 'basePrice', 'stockQuantity'];
    for (const field of requiredFields) {
      if (!record[field] || record[field].toString().trim() === '') {
        errors.push({
          row: rowNumber,
          error: `Required field '${field}' is missing or empty`,
          data: record
        });
      }
    }

    // Data type validation
    const numericFields = ['basePrice', 'stockQuantity', 'lowStockThreshold'];
    for (const field of numericFields) {
      if (record[field] && isNaN(Number(record[field]))) {
        errors.push({
          row: rowNumber,
          error: `Field '${field}' must be a valid number`,
          data: record
        });
      }
    }

    // Business logic validation
    if (record.basePrice && Number(record.basePrice) <= 0) {
      errors.push({
        row: rowNumber,
        error: 'Base price must be greater than 0',
        data: record
      });
    }

    if (record.stockQuantity && Number(record.stockQuantity) < 0) {
      errors.push({
        row: rowNumber,
        error: 'Stock quantity cannot be negative',
        data: record
      });
    }

    // Warnings for missing optional but important fields
    const importantFields = ['description', 'processor', 'gpu', 'budgetRange'];
    for (const field of importantFields) {
      if (!record[field] || record[field].toString().trim() === '') {
        warnings.push({
          row: rowNumber,
          message: `Optional field '${field}' is empty but recommended`,
          data: record
        });
      }
    }

    // Convert and clean data
    const cleanedData: InventoryRecord = {
      id: record.id ? Number(record.id) : undefined,
      name: record.name?.toString().trim() || '',
      category: record.category?.toString().trim() || '',
      basePrice: Number(record.basePrice) || 0,
      stockQuantity: Number(record.stockQuantity) || 0,
      lowStockThreshold: Number(record.lowStockThreshold) || 5,
      description: record.description?.toString().trim() || '',
      processor: record.processor?.toString().trim() || '',
      motherboard: record.motherboard?.toString().trim() || '',
      ram: record.ram?.toString().trim() || '',
      storage: record.storage?.toString().trim() || '',
      gpu: record.gpu?.toString().trim() || '',
      casePsu: record.casePsu?.toString().trim() || '',
      monitor: record.monitor?.toString().trim() || '',
      keyboardMouse: record.keyboardMouse?.toString().trim() || '',
      mousePad: record.mousePad?.toString().trim() || '',
      budgetRange: record.budgetRange?.toString().trim() || '',
      tags: record.tags?.toString().trim() || '',
      isActive: record.isActive === 'true' || record.isActive === true || record.isActive === 1
    };

    return {
      isValid: errors.length === 0,
      data: cleanedData,
      errors,
      warnings
    };
  }

  private async createInventoryItem(data: InventoryRecord): Promise<PcBuild | null> {
    try {
      const insertData: InsertPcBuild = {
        name: data.name,
        category: data.category,
        basePrice: data.basePrice,
        stockQuantity: data.stockQuantity,
        lowStockThreshold: data.lowStockThreshold,
        description: data.description,
        processor: data.processor,
        motherboard: data.motherboard,
        ram: data.ram,
        storage: data.storage,
        gpu: data.gpu,
        casePsu: data.casePsu,
        monitor: data.monitor,
        keyboardMouse: data.keyboardMouse,
        mousePad: data.mousePad,
        budgetRange: data.budgetRange,
        tags: data.tags ? data.tags.split(';').filter(tag => tag.trim()) : [],
        isActive: data.isActive
      };

      return await storage.createPcBuild(insertData);
    } catch (error) {
      console.error('Error creating inventory item:', error);
      return null;
    }
  }

  private async updateInventoryItem(data: InventoryRecord): Promise<PcBuild | null> {
    try {
      if (!data.id) throw new Error('ID required for update');

      const updateData = {
        name: data.name,
        category: data.category,
        basePrice: data.basePrice,
        stockQuantity: data.stockQuantity,
        lowStockThreshold: data.lowStockThreshold,
        description: data.description,
        processor: data.processor,
        motherboard: data.motherboard,
        ram: data.ram,
        storage: data.storage,
        gpu: data.gpu,
        casePsu: data.casePsu,
        monitor: data.monitor,
        keyboardMouse: data.keyboardMouse,
        mousePad: data.mousePad,
        budgetRange: data.budgetRange,
        tags: data.tags ? data.tags.split(';').filter(tag => tag.trim()) : [],
        isActive: data.isActive,
        updatedAt: new Date()
      };

      return await storage.updatePcBuild(data.id, updateData);
    } catch (error) {
      console.error('Error updating inventory item:', error);
      return null;
    }
  }

  private async generateImportReport(result: BulkImportResult, originalFilePath: string): Promise<void> {
    try {
      const reportData = {
        importDate: new Date().toISOString(),
        originalFile: path.basename(originalFilePath),
        summary: {
          totalProcessed: result.totalProcessed,
          successCount: result.successCount,
          errorCount: result.errorCount,
          warningCount: result.warnings.length
        },
        errors: result.errors,
        warnings: result.warnings
      };

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportFileName = `import_report_${timestamp}.json`;
      const reportPath = path.join(this.exportsDir, reportFileName);

      await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2), 'utf-8');
      console.log(`Import report generated: ${reportFileName}`);

    } catch (error) {
      console.error('Error generating import report:', error);
    }
  }
}

export const bulkInventoryManager = new BulkInventoryManager();