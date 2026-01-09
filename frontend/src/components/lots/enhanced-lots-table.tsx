'use client';

import { useState, useEffect } from 'react';
import { DataTable, TableColumn } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { useLocale } from '@/components/local-lang-swither';
import { getMessages } from '@/lib/locale';
import { lotsApi, Lot, LotStatus, LotDetail } from '@/services/api/lots';
import { toast } from 'sonner';
import { CreateLotDialog } from './create-lot-dialog';
import { CreateLotDetailDialog } from './create-lot-detail-dialog';
import { EditLotDialog } from './edit-lot-dialog';

interface EnhancedLotsTableProps {
  startDate?: Date;
  endDate?: Date;
  initialSearch?: string;
}

export function EnhancedLotsTable({ startDate, endDate, initialSearch }: EnhancedLotsTableProps) {
  const { locale } = useLocale();
  const t = getMessages(locale);

  const [lots, setLots] = useState<Lot[]>([]);
  const [filteredLots, setFilteredLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [lotDetails, setLotDetails] = useState<Record<string, LotDetail[]>>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDetailDialogOpen, setCreateDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [search, setSearch] = useState(initialSearch || '');

  const fetchLots = async () => {
    try {
      setLoading(true);
      const response = await lotsApi.getLots(1, 100);
      setLots(response.lots);
    } catch (error) {
      console.error('Failed to fetch lots:', error);
      toast.error(t.pages.lots.fetchError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLots();
  }, []);

  // Update search when initialSearch changes
  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  // Filter lots by date range and search (including detailId)
  useEffect(() => {
    let filtered = lots;

    if (startDate) {
      filtered = filtered.filter((lot) => {
        const lotDate = new Date(lot.createdAt);
        return lotDate >= startDate;
      });
    }

    if (endDate) {
      filtered = filtered.filter((lot) => {
        const lotDate = new Date(lot.createdAt);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // End of day
        return lotDate <= end;
      });
    }

    // Filter by search term (including detailId from nested lot details)
    if (search) {
      filtered = filtered.filter((lot) => {
        // Check if lot fields match
        const lotMatches =
          lot.companyName?.toLowerCase().includes(search.toLowerCase()) ||
          lot.companyCity?.toLowerCase().includes(search.toLowerCase()) ||
          lot.lotId?.toString().includes(search) ||
          lot.notes?.toLowerCase().includes(search.toLowerCase());

        // Check if any detail's detailId matches
        const details = lotDetails[lot.id] || [];
        const detailMatches = details.some((detail) =>
          detail.detailId?.toString().includes(search)
        );

        return lotMatches || detailMatches;
      });
    }

    setFilteredLots(filtered);
  }, [lots, startDate, endDate, search, lotDetails]);

  const getStatusBadge = (status: LotStatus) => {
    const statusConfig = {
      PENDING: {
        variant: 'secondary' as const,
        label: t.pages.lots.status.pending,
      },
      IN_TRANSIT: {
        variant: 'default' as const,
        label: t.pages.lots.status.inTransit,
      },
      ARRIVED: {
        variant: 'outline' as const,
        label: t.pages.lots.status.arrived,
      },
      VERIFIED: {
        variant: 'default' as const,
        label: t.pages.lots.status.verified,
      },
      COMPLETED: {
        variant: 'default' as const,
        label: t.pages.lots.status.completed,
      },
      CANCELLED: {
        variant: 'destructive' as const,
        label: t.pages.lots.status.cancelled,
      },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.pages.lots.confirmDelete)) return;

    try {
      await lotsApi.deleteLot(id);
      toast.success(t.pages.lots.deleteSuccess);
      fetchLots();
    } catch (error) {
      console.error('Failed to delete lot:', error);
      toast.error(t.pages.lots.deleteError);
    }
  };

  const handleEdit = (lot: Lot) => {
    setSelectedLot(lot);
    setEditDialogOpen(true);
  };

  const handleAddDetail = (lot: Lot) => {
    setSelectedLot(lot);
    setCreateDetailDialogOpen(true);
  };

  const handleRowExpand = async (lot: Lot) => {
    if (!lotDetails[lot.id]) {
      try {
        const details = await lotsApi.getLotDetailsByLotId(lot.id);
        setLotDetails((prev) => ({ ...prev, [lot.id]: details }));
      } catch (error) {
        console.error('Failed to fetch lot details:', error);
        toast.error(t.pages.lots.fetchDetailsError);
      }
    }
  };

  const getDetailStatus = (detail: LotDetail) => {
    // Check if there are any arrivals for this detail
    if (detail.arrivals && detail.arrivals.length > 0) {
      const latestArrival = detail.arrivals[0]; // Assuming first is latest
      return latestArrival.status;
    }

    // Check piece details statuses
    if (detail.pieceDetails && detail.pieceDetails.length > 0) {
      const hasVerified = detail.pieceDetails.some(p => p.status === 'verified');
      const hasDamaged = detail.pieceDetails.some(p => p.status === 'damaged');
      const hasIncomplete = detail.pieceDetails.some(p => p.status === 'incomplete');
      const hasExcess = detail.pieceDetails.some(p => p.status === 'excess');

      if (hasDamaged) return 'DAMAGED';
      if (hasIncomplete) return 'INCOMPLETE';
      if (hasExcess) return 'EXCESS';
      if (hasVerified) return 'VERIFIED';
    }

    return 'PENDING';
  };

  const getDetailStatusBadge = (status: string) => {
    const statusConfig: Record<string, { className: string; label: string }> = {
      PENDING: {
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        label: t.pages.lotArrivals.status.pending,
      },
      VERIFIED: {
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800',
        label: t.pages.lotArrivals.status.verified,
      },
      DAMAGED: {
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-800',
        label: t.pages.lotArrivals.status.damaged,
      },
      INCOMPLETE: {
        className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 border-orange-200 dark:border-orange-800',
        label: t.pages.lotArrivals.status.incomplete,
      },
      EXCESS: {
        className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        label: t.pages.lotArrivals.status.excess,
      },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  const renderExpandedRow = (lot: Lot) => {
    const details = lotDetails[lot.id];

    return (
      <div className="p-4">
        <h3 className="font-semibold mb-2">{t.pages.lots.lotDetails}</h3>
        {!details || details.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t.pages.lots.noDetails}
          </p>
        ) : (
          <div className="space-y-2">
            {details.map((detail) => (
              <div
                key={detail.id}
                className="border rounded p-3 bg-background"
              >
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                  <div>
                    <span className="font-medium">
                      {t.pages.lots.detailId}:
                    </span>{' '}
                    #{detail.detailId}
                  </div>
                  <div>
                    <span className="font-medium">
                      {t.pages.lots.quantity}:
                    </span>{' '}
                    {detail.quantity}
                  </div>
                  <div>
                    <span className="font-medium">
                      {t.pages.lots.price}:
                    </span>{' '}
                    {Number(detail.price).toFixed(2)} MAD
                  </div>
                  <div>
                    <span className="font-medium">
                      {t.pages.lots.shippingCompany}:
                    </span>{' '}
                    {detail.shippingCompany}
                  </div>
                  <div>
                    <span className="font-medium">
                      {t.pages.lotArrivals.status.label}:
                    </span>{' '}
                    {getDetailStatusBadge(getDetailStatus(detail))}
                  </div>
                </div>
                {detail.pieceDetails && detail.pieceDetails.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <span className="text-xs font-medium">
                      {t.pages.lots.pieces}:
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {detail.pieceDetails.map((piece, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-xs"
                        >
                          {piece.name} ({piece.quantity})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {detail.notes && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {t.pages.lots.notes}: {detail.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const columns: TableColumn<Lot>[] = [
    {
      key: 'lotId',
      label: t.pages.lots.lotId,
      render: (lot) => <span className="font-medium">#{lot.lotId}</span>,
    },
    {
      key: 'companyName',
      label: t.pages.lots.companyName,
    },
    {
      key: 'companyCity',
      label: t.pages.lots.companyCity,
    },
    {
      key: 'totalQuantity',
      label: t.pages.lots.totalQuantity,
    },
    {
      key: 'totalPrice',
      label: t.pages.lots.totalPrice,
      render: (lot) => `${Number(lot.totalPrice).toFixed(2)} MAD`,
    },
    {
      key: 'status',
      label: t.pages.lots.status.label,
      render: (lot) => getStatusBadge(lot.status),
    },
    {
      key: 'createdAt',
      label: t.pages.lots.createdAt,
      render: (lot) => new Date(lot.createdAt).toLocaleDateString(locale),
    },
    {
      key: 'actions',
      label: t.common.actions,
      render: (lot) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleAddDetail(lot);
            }}
          >
            <Package className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(lot);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(lot.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <div className="text-center py-8">{t.common.loading}</div>;
  }

  return (
    <>
      <DataTable
        title=""
        data={filteredLots}
        columns={columns}
        searchKeys={['companyName', 'companyCity', 'lotId', 'notes']}
        searchPlaceholder={t.pages.lots.searchPlaceholder}
        emptyMessage={t.pages.lots.noData}
        searchValue={search}
        onSearchChange={setSearch}
        expandable={true}
        renderExpandedRow={renderExpandedRow}
        onRowExpand={handleRowExpand}
        customHeader={
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t.pages.lots.createLot}
          </Button>
        }
      />

      {/* Dialogs */}
      <CreateLotDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchLots}
      />

      {selectedLot && (
        <>
          <CreateLotDetailDialog
            open={createDetailDialogOpen}
            onOpenChange={setCreateDetailDialogOpen}
            lot={selectedLot}
            onSuccess={() => {
              // Refresh lot details
              lotsApi.getLotDetailsByLotId(selectedLot.id).then((details) => {
                setLotDetails((prev) => ({
                  ...prev,
                  [selectedLot.id]: details,
                }));
              });
            }}
          />

          <EditLotDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            lot={selectedLot}
            onSuccess={fetchLots}
          />
        </>
      )}
    </>
  );
}
