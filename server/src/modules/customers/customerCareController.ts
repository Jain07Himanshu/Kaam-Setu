import { Request, Response } from 'express';
import { prisma } from '../../database/prisma.js';

export async function getCustomerCareInfo(req: Request, res: Response) {
  try {
    const careSetting = await prisma.customerCareSetting.findUnique({
      where: { settingKey: 'CUSTOMER_CARE_PHONE' },
    });

    const phone = careSetting?.settingValue || process.env.CUSTOMER_CARE_PHONE || '+91 80000 12345';

    res.json({
      customerCarePhone: phone,
      email: 'support@kaamsetu.in',
      hours: '24/7 National Grievance & Emergency Support Helpline',
      helplineDirectory: [
        { name: 'National Emergency Response System', number: '112', purpose: 'Immediate Police, Fire, Ambulance' },
        { name: 'National Police Helpline', number: '100', purpose: 'Local Police Assistance' },
        { name: 'Women Helpline (All India)', number: '1091', purpose: 'Women Safety & Protection' },
        { name: 'Ambulance & Medical Emergency', number: '108', purpose: 'Rapid Medical Response' },
      ],
      safetyPledge: 'Kaam Setu guarantees worker dignity, customer security, zero unauthorized price extortion, and prompt grievance resolution under Indian Consumer & Labour frameworks.',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve customer care details', details: error.message });
  }
}
