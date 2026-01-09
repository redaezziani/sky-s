'use client';

import { useState, useEffect } from 'react';
import { DataTable, TableColumn } from '@/components/shared/data-table';
import { useLocale } from '@/components/local-lang-swither';
import { getMessages } from '@/lib/locale';
import { lotsApi, LotArrival, ArrivalStatus } from '@/services/api/lots';
import { Button } from '@/components/ui/button';
import { Edit, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { VerifyArrivalDialog } from './verify-arrival-dialog';
import { ViewArrivalDialog } from './view-arrival-dialog';
import { toast } from 'sonner';
import Link from 'next/link';

interface LotArrivalsTableProps {
  statusFilter: ArrivalStatus | 'ALL';
  startDate?: Date;
  endDate?: Date;
}

export function LotArrivalsTable({ statusFilter, startDate, endDate }: LotArrivalsTableProps) {
  const { locale } = useLocale();
  const t = getMessages(locale);

  const [arrivals, setArrivals] = useState<LotArrival[]>([]);
  const [filteredArrivals, setFilteredArrivals] = useState<LotArrival[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedArrival, setSelectedArrival] = useState<LotArrival | null>(null);
  const [search, setSearch] = useState('');

  const fetchArrivals = async () => {
    try {
      setLoading(true);
      const response = await lotsApi.getLotArrivals(
        1,
        100,
        undefined,
        statusFilter === 'ALL' ? undefined : statusFilter
      );
      setArrivals(response.lotArrivals);
    } catch (error) {
      console.error('Failed to fetch lot arrivals:', error);
      toast.error(t.pages.lotArrivals.fetchError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArrivals();
  }, [statusFilter]);

  // Filter arrivals by date range
  useEffect(() => {
    let filtered = arrivals;

    if (startDate) {
      filtered = filtered.filter((arrival) => {
        const arrivalDate = new Date(arrival.createdAt);
        return arrivalDate >= startDate;
      });
    }

    if (endDate) {
      filtered = filtered.filter((arrival) => {
        const arrivalDate = new Date(arrival.createdAt);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // End of day
        return arrivalDate <= end;
      });
    }

    setFilteredArrivals(filtered);
  }, [arrivals, startDate, endDate]);

  const getStatusBadge = (status: ArrivalStatus) => {
    const statusConfig: Record<ArrivalStatus, { className: string; label: string }> = {
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

  const handleVerify = (arrival: LotArrival) => {
    setSelectedArrival(arrival);
    setVerifyDialogOpen(true);
  };

  const handleView = (arrival: LotArrival) => {
    setSelectedArrival(arrival);
    setViewDialogOpen(true);
  };

  const columns: TableColumn<LotArrival>[] = [
    {
      key: 'arrivalId',
      label: t.pages.lotArrivals.arrivalId,
      render: (arrival) => (
        <span className="font-medium">#{arrival.arrivalId}</span>
      ),
    },
    {
      key: 'lotDetailId',
      label: t.pages.lotArrivals.lotDetailId,
      render: (arrival) => (
        <Link
          href={`/dashboard/lots?detailId=${arrival.lotDetail?.detailId || arrival.lotDetailId}`}
          className="text-primary hover:underline font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          #{arrival.lotDetail?.detailId || arrival.lotDetailId}
        </Link>
      ),
    },
    {
      key: 'quantity',
      label: t.pages.lotArrivals.quantity,
    },
    {
      key: 'price',
      label: t.pages.lotArrivals.price,
      render: (arrival) => `${Number(arrival.price).toFixed(2)} MAD`,
    },
    {
      key: 'shippingCompany',
      label: t.pages.lotArrivals.shippingCompany,
    },
    {
      key: 'status',
      label: t.pages.lotArrivals.status.label,
      render: (arrival) => getStatusBadge(arrival.status),
    },
    {
      key: 'verifiedAt',
      label: t.pages.lotArrivals.verifiedAt,
      render: (arrival) =>
        arrival.verifiedAt
          ? new Date(arrival.verifiedAt).toLocaleDateString(locale)
          : '-',
    },
    {
      key: 'actions',
      label: t.common.actions,
      render: (arrival) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleView(arrival);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleVerify(arrival);
            }}
          >
            <Edit className="h-4 w-4" />
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
        data={filteredArrivals}
        columns={columns}
        searchKeys={['arrivalId', 'shippingCompany', 'shippingCity']}
        searchPlaceholder={t.common.search}
        emptyMessage={t.pages.lotArrivals.noData}
        searchValue={search}
        onSearchChange={setSearch}
      />

      {selectedArrival && (
        <>
          <VerifyArrivalDialog
            open={verifyDialogOpen}
            onOpenChange={setVerifyDialogOpen}
            arrival={selectedArrival}
            onSuccess={fetchArrivals}
          />

          <ViewArrivalDialog
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
            arrival={selectedArrival}
          />
        </>
      )}
    </>
  );
}
