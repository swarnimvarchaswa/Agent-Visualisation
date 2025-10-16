export interface IAgent {
  cpId: string;
  name: string;
  kamName: string;
  kamId: string;
  userType: 'premium' | 'trial' | 'basic';
  noOfInventories: number;
  noOfEnquiries: number;
  agentStatus: string;
  phoneNumber: string;
  emailAddress?: string;
  firmName?: string;
  activity: string;
  verified: boolean;
  lastSeen?: number;
  areaOfOperation?: string[];
  enquiryReceived?: string[];
  myInventories?: string[];
  inventoryStatus?: {
    delisted: number;
    available: number;
    sold: number;
    hold: number;
  };
}

export interface AgentData {
  [key: string]: IAgent;
}

export type UserType = 'all' | 'premium' | 'trial' | 'basic';
