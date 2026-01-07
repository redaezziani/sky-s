import { axiosInstance } from '@/lib/utils';

export enum LotStatus {
  PENDING = 'PENDING',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVED = 'ARRIVED',
  VERIFIED = 'VERIFIED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ArrivalStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  DAMAGED = 'DAMAGED',
  INCOMPLETE = 'INCOMPLETE',
  EXCESS = 'EXCESS',
}

export interface PieceDetail {
  name: string;
  quantity: number;
  status: string;
}

export interface Lot {
  id: string;
  lotId: number;
  totalPrice: number;
  totalQuantity: number;
  companyName: string;
  companyCity: string;
  status: LotStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  details?: LotDetail[];
  arrivals?: LotArrival[];
}

export interface LotDetail {
  id: string;
  detailId: number;
  lotId: string;
  quantity: number;
  price: number;
  shippingCompany: string;
  shippingCompanyCity: string;
  pieceDetails: PieceDetail[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  arrivals?: LotArrival[];
}

export interface LotArrival {
  id: string;
  arrivalId: number;
  lotId: string;
  lotDetailId: string;
  quantity: number;
  price: number;
  shippingCompany: string;
  shippingCompanyCity: string;
  pieceDetails: PieceDetail[];
  status: ArrivalStatus;
  notes?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  lotDetail?: LotDetail;
}

export interface CreateLotDto {
  totalPrice: number;
  totalQuantity: number;
  companyName: string;
  companyCity: string;
  notes?: string;
  status?: LotStatus;
}

export interface UpdateLotDto {
  totalPrice?: number;
  totalQuantity?: number;
  companyName?: string;
  companyCity?: string;
  notes?: string;
  status?: LotStatus;
}

export interface CreateLotDetailDto {
  lotId: string;
  quantity: number;
  price: number;
  shippingCompany: string;
  shippingCompanyCity: string;
  pieceDetails: PieceDetail[];
  notes?: string;
}

export interface UpdateLotDetailDto {
  quantity?: number;
  price?: number;
  shippingCompany?: string;
  shippingCompanyCity?: string;
  pieceDetails?: PieceDetail[];
  notes?: string;
}

export interface UpdateLotArrivalDto {
  quantity?: number;
  price?: number;
  shippingCompany?: string;
  shippingCompanyCity?: string;
  pieceDetails?: PieceDetail[];
  status?: ArrivalStatus;
  notes?: string;
}

export interface PaginatedLotsResponse {
  lots: Lot[];
  total: number;
}

export interface PaginatedLotDetailsResponse {
  lotDetails: LotDetail[];
  total: number;
}

export interface PaginatedLotArrivalsResponse {
  lotArrivals: LotArrival[];
  total: number;
}

export const lotsApi = {
  // Lots
  async getLots(page = 1, limit = 10, status?: LotStatus): Promise<PaginatedLotsResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);

    const response = await axiosInstance.get<PaginatedLotsResponse>(`/lots?${params.toString()}`);
    return response.data;
  },

  async getLotById(id: string): Promise<Lot> {
    const response = await axiosInstance.get<Lot>(`/lots/${id}`);
    return response.data;
  },

  async getLotByLotId(lotId: number): Promise<Lot> {
    const response = await axiosInstance.get<Lot>(`/lots/lotId/${lotId}`);
    return response.data;
  },

  async createLot(data: CreateLotDto): Promise<Lot> {
    const response = await axiosInstance.post<Lot>('/lots', data);
    return response.data;
  },

  async updateLot(id: string, data: UpdateLotDto): Promise<Lot> {
    const response = await axiosInstance.patch<Lot>(`/lots/${id}`, data);
    return response.data;
  },

  async deleteLot(id: string): Promise<void> {
    await axiosInstance.delete(`/lots/${id}`);
  },

  // Lot Details
  async getLotDetails(page = 1, limit = 10, lotId?: string): Promise<PaginatedLotDetailsResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (lotId) params.append('lotId', lotId);

    const response = await axiosInstance.get<PaginatedLotDetailsResponse>(`/lot-details?${params.toString()}`);
    return response.data;
  },

  async getLotDetailById(id: string): Promise<LotDetail> {
    const response = await axiosInstance.get<LotDetail>(`/lot-details/${id}`);
    return response.data;
  },

  async getLotDetailsByLotId(lotId: string): Promise<LotDetail[]> {
    const response = await axiosInstance.get<LotDetail[]>(`/lot-details/by-lot/${lotId}`);
    return response.data;
  },

  async createLotDetail(data: CreateLotDetailDto): Promise<LotDetail> {
    const response = await axiosInstance.post<LotDetail>('/lot-details', data);
    return response.data;
  },

  async updateLotDetail(id: string, data: UpdateLotDetailDto): Promise<LotDetail> {
    const response = await axiosInstance.patch<LotDetail>(`/lot-details/${id}`, data);
    return response.data;
  },

  async deleteLotDetail(id: string): Promise<void> {
    await axiosInstance.delete(`/lot-details/${id}`);
  },

  // Lot Arrivals
  async getLotArrivals(page = 1, limit = 10, lotId?: string, status?: ArrivalStatus): Promise<PaginatedLotArrivalsResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (lotId) params.append('lotId', lotId);
    if (status) params.append('status', status);

    const response = await axiosInstance.get<PaginatedLotArrivalsResponse>(`/lot-arrivals?${params.toString()}`);
    return response.data;
  },

  async getLotArrivalById(id: string): Promise<LotArrival> {
    const response = await axiosInstance.get<LotArrival>(`/lot-arrivals/${id}`);
    return response.data;
  },

  async getLotArrivalsByLotId(lotId: string): Promise<LotArrival[]> {
    const response = await axiosInstance.get<LotArrival[]>(`/lot-arrivals/by-lot/${lotId}`);
    return response.data;
  },

  async getLotArrivalsByLotDetailId(lotDetailId: string): Promise<LotArrival[]> {
    const response = await axiosInstance.get<LotArrival[]>(`/lot-arrivals/by-lot-detail/${lotDetailId}`);
    return response.data;
  },

  async updateLotArrival(id: string, data: UpdateLotArrivalDto): Promise<LotArrival> {
    const response = await axiosInstance.patch<LotArrival>(`/lot-arrivals/${id}`, data);
    return response.data;
  },

  async deleteLotArrival(id: string): Promise<void> {
    await axiosInstance.delete(`/lot-arrivals/${id}`);
  },
};
