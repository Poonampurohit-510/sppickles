import { Fragment, useDeferredValue, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { ChevronDown, Loader2, LogOut, RefreshCw, Search, ShoppingCart, Clock, Truck, TrendingUp, Package, Box } from "lucide-react";
import { motion } from "framer-motion";
import Seo from "@/components/Seo";
import { useStore } from "@/components/StoreProvider";
import { type OrderStatus, type OrderRecord } from "@/data/site";
import { useOrdersQuery, useUpdateOrderMutation } from "@/lib/api";
import { formatCurrency } from "@/lib/pricing";
import { AdminStockToggle } from "@/components/admin/AdminStockToggle";

const pageWrap = "w-full px-6 md:px-10 lg:px-16 xl:px-24";

const STATUS_META: Record<
  OrderStatus,
  {
    label: string;
    badgeClassName: string;
    cardClassName: string;
    selectClassName: string;
  }
> = {
  pending: {
    label: "Pending",
    badgeClassName: "border-gold/30 bg-gold text-theme-on-accent",
    cardClassName: "theme-card-soft",
    selectClassName: "border-gold/30 bg-forest-dark text-theme-on-accent",
  },
  processing: {
    label: "Processing",
    badgeClassName: "border-mint/18 bg-forest-dark text-white/75",
    cardClassName: "theme-card-soft",
    selectClassName: "border-mint/18 bg-forest-dark text-white/75",
  },
  delivered: {
    label: "Delivered",
    badgeClassName: "border-mint/18 bg-forest-medium text-theme-contrast",
    cardClassName: "theme-card",
    selectClassName: "border-green-600/40 bg-green-500/20 text-green-700 font-semibold",
  },
};

const ORDER_STATUSES: OrderStatus[] = ["pending", "processing", "delivered"];

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const formatAddress = (order: OrderRecord) =>
  [
    order.customer.address,
    order.customer.city,
    order.customer.state,
    order.customer.country === "IN" ? "India" : order.customer.country,
    order.customer.pincode,
  ]
    .filter(Boolean)
    .join(", ");

const AdminDashboardPage = () => {
  const { isAdminReady, isAdminAuthenticated, adminEmail, logoutAdmin } = useStore();
  const { data: orders = [], isLoading, isRefetching, error, refetch } = useOrdersQuery();
  const updateOrderMutation = useUpdateOrderMutation();
  const [activeTab, setActiveTab] = useState<"orders" | "stock">("orders");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery.trim().toLowerCase());

  const metrics = useMemo(() => {
    const counts = {
      pending: 0,
      processing: 0,
      delivered: 0,
    } as Record<OrderStatus, number>;

    let revenue = 0;

    for (const order of orders) {
      counts[order.status] += 1;
      revenue += order.total;
    }

    return {
      counts,
      revenue,
      totalOrders: orders.length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const phoneSearch = deferredSearchQuery.replace(/\D/g, "");

    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }

      if (!deferredSearchQuery) {
        return true;
      }

      const orderId = order.id.toLowerCase();
      const phone = order.customer.phone.replace(/\D/g, "");

      return orderId.includes(deferredSearchQuery) || (phoneSearch.length > 0 && phone.includes(phoneSearch));
    });
  }, [deferredSearchQuery, orders, statusFilter]);

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    setStatusUpdateError(null);
    setUpdatingId(orderId);

    try {
      await updateOrderMutation.mutateAsync({ orderId, status: nextStatus });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update the order status.";
      console.error("Failed to update order status", error);
      setStatusUpdateError(message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isAdminReady) {
    return (
      <main className="min-h-screen bg-forest-dark px-6 py-20">
        <div className="theme-card mx-auto max-w-2xl rounded-[2rem] border px-8 py-16 text-center shadow-md">
          <p className="text-theme-heading text-sm font-semibold uppercase tracking-[0.26em]">
            Loading
          </p>
          <h1 className="mt-4 font-heading text-4xl font-semibold">
            Preparing order management
          </h1>
        </div>
      </main>
    );
  }

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#173324_0%,#1a3a2a_58%,#10261b_100%)] py-16">
      <Seo
        title="SP Traditional Pickles | Admin Orders"
        description="Manage customer orders, statuses, and item details from the admin panel."
      />

      <section className={pageWrap}>
        {/* Tab Navigation */}
        <div className="mb-8 flex gap-4 border-b border-mint/12">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-base transition-colors ${
              activeTab === "orders"
                ? "border-b-2 border-gold text-theme-heading"
                : "text-white/75 hover:text-theme-heading"
            }`}
          >
            <ShoppingCart className="h-5 w-5" />
            Orders
          </button>
          <button
            onClick={() => setActiveTab("stock")}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-base transition-colors ${
              activeTab === "stock"
                ? "border-b-2 border-gold text-theme-heading"
                : "text-white/75 hover:text-theme-heading"
            }`}
          >
            <Package className="h-5 w-5" />
            Stock Management
          </button>
        </div>

        {/* Stock Management Tab */}
        {activeTab === "stock" && <AdminStockToggle />}

        {/* Orders Tab Content */}
        {activeTab === "orders" && (
        <div>
        <div className="theme-card rounded-[2rem] border p-8 shadow-md">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-theme-heading text-sm font-semibold uppercase tracking-[0.26em]">
                Admin Orders
              </p>
              <h1 className="mt-4 font-heading text-5xl font-semibold md:text-6xl">
                Real order management
              </h1>
              <p className="text-white/85 mt-4 text-lg leading-8">
                Review customer orders, update delivery progress, and open each row to inspect the
                full item list before dispatch.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <div className="rounded-full border border-gold/25 bg-gold px-5 py-3 text-sm font-semibold text-theme-on-accent">
                Logged in as {adminEmail}
              </div>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isLoading || isRefetching}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-mint/18 bg-forest-dark px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-gold/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={logoutAdmin}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-mint/18 bg-forest-dark px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-gold/10 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Orders Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0 }}
              className="relative overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-br from-gold/15 via-forest-dark to-forest-dark p-8 shadow-lg"
            >
              <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-gold/10 blur-3xl"></div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-2 right-2 opacity-20"
              >
                <ShoppingCart className="h-16 w-16 text-gold" />
              </motion.div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-3 rounded-full bg-gold/20 px-3 py-1">
                  <ShoppingCart className="h-4 w-4 text-gold" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gold">Total Orders</span>
                </div>
                <motion.p
                  key={metrics.totalOrders}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 font-heading text-5xl font-bold text-white"
                >
                  {metrics.totalOrders}
                </motion.p>
                <p className="text-white/75 mt-3 text-sm leading-6">
                  Total revenue: <span className="font-semibold text-gold">{formatCurrency(metrics.revenue)}</span>
                </p>
              </div>
            </motion.div>

            {/* Pending Orders Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-gold/20 via-forest-dark to-forest-dark p-8 shadow-lg"
            >
              <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-gold/15 blur-3xl"></div>
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-2 right-2 opacity-25"
              >
                <Clock className="h-16 w-16 text-gold" />
              </motion.div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-3 rounded-full bg-gold/25 px-3 py-1">
                  <Clock className="h-4 w-4 text-gold" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gold">Pending</span>
                </div>
                <motion.p
                  key={metrics.counts.pending}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 font-heading text-5xl font-bold text-gold"
                >
                  {metrics.counts.pending}
                </motion.p>
                <p className="text-white/75 mt-3 text-sm leading-6">
                  Fresh orders waiting for action
                </p>
              </div>
            </motion.div>

            {/* Processing Orders Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative overflow-hidden rounded-3xl border border-mint/25 bg-gradient-to-br from-mint/15 via-forest-dark to-forest-dark p-8 shadow-lg"
            >
              <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-mint/10 blur-3xl"></div>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-2 right-2 opacity-20"
              >
                <TrendingUp className="h-16 w-16 text-emerald-400" />
              </motion.div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-3 rounded-full bg-emerald-500/20 px-3 py-1">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Processing</span>
                </div>
                <motion.p
                  key={metrics.counts.processing}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 font-heading text-5xl font-bold text-emerald-400"
                >
                  {metrics.counts.processing}
                </motion.p>
                <p className="text-white/75 mt-3 text-sm leading-6">
                  Orders being prepared now
                </p>
              </div>
            </motion.div>

            {/* Delivered Orders Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative overflow-hidden rounded-3xl border border-green-500/30 bg-gradient-to-br from-green-500/15 via-forest-dark to-forest-dark p-8 shadow-lg"
            >
              <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-green-500/10 blur-3xl"></div>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-2 right-2 opacity-20"
              >
                <Truck className="h-16 w-16 text-green-400" />
              </motion.div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-3 rounded-full bg-green-500/20 px-3 py-1">
                  <Truck className="h-4 w-4 text-green-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-green-400">Delivered</span>
                </div>
                <motion.p
                  key={metrics.counts.delivered}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 font-heading text-5xl font-bold text-green-400"
                >
                  {metrics.counts.delivered}
                </motion.p>
                <p className="text-white/75 mt-3 text-sm leading-6">
                  Successfully completed
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="theme-card mt-8 rounded-[2rem] border p-6 shadow-md">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-theme-heading text-sm font-semibold uppercase tracking-[0.24em]">
                Filters
              </p>
              <p className="text-white/75 mt-2 text-sm leading-7">
                Search by phone number or order ID, then click any row to view the full items list.
              </p>
            </div>

            <div className="relative w-full lg:max-w-md">
              <Search className="text-white/50 pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by order ID or phone"
                className="theme-input w-full rounded-full border py-3 pl-11 pr-4 text-sm outline-none transition focus:border-gold"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                statusFilter === "all"
                  ? "border-gold bg-gold text-theme-on-accent"
                  : "border-mint/18 bg-forest-dark text-white/75 hover:bg-gold/10 hover:text-white/90"
              }`}
            >
              All ({orders.length})
            </button>
            {ORDER_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  statusFilter === status
                    ? "border-mint/18 bg-forest-medium text-white font-bold"
                    : "border-mint/18 bg-forest-dark text-white/75 hover:bg-gold/10 hover:text-white/90"
                }`}
              >
                {STATUS_META[status].label} ({metrics.counts[status]})
              </button>
            ))}
          </div>

          <div className="text-white/70 mt-4 text-sm font-medium">
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
        </div>

        <div className="theme-card mt-8 overflow-hidden rounded-[2rem] border shadow-md">
          {statusUpdateError ? (
            <div className="border-b border-gold/18 bg-gold/12 px-6 py-4">
              <p className="text-theme-on-accent text-sm font-semibold">Status update failed</p>
              <p className="text-theme-on-accent mt-1 text-sm leading-6">{statusUpdateError}</p>
            </div>
          ) : null}
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full border-collapse">
              <thead className="theme-card-soft">
                <tr className="text-left">
                  <th className="text-white/70 px-6 py-4 text-xs font-bold uppercase tracking-[0.22em]">
                    Order ID
                  </th>
                  <th className="text-white/70 px-6 py-4 text-xs font-bold uppercase tracking-[0.22em]">
                    Customer Name
                  </th>
                  <th className="text-white/70 px-6 py-4 text-xs font-bold uppercase tracking-[0.22em]">
                    Phone
                  </th>
                  <th className="text-white/70 px-6 py-4 text-xs font-bold uppercase tracking-[0.22em]">
                    Address
                  </th>
                  <th className="text-white/70 px-6 py-4 text-xs font-bold uppercase tracking-[0.22em]">
                    Total
                  </th>
                  <th className="text-white/70 px-6 py-4 text-xs font-bold uppercase tracking-[0.22em]">
                    Date &amp; Time
                  </th>
                  <th className="text-white/70 px-6 py-4 text-xs font-bold uppercase tracking-[0.22em]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr className="border-t border-mint/10">
                    <td colSpan={7} className="px-6 py-14 text-center">
                      <div className="inline-flex items-center gap-3 rounded-full bg-gold/15 px-5 py-3 text-sm font-semibold text-theme-heading">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading orders
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr className="border-t border-mint/10">
                    <td colSpan={7} className="px-6 py-14 text-center">
                      <div className="mx-auto max-w-xl rounded-2xl border border-gold/20 bg-gold/12 px-6 py-6">
                        <p className="text-theme-on-accent text-lg font-semibold">Unable to load orders</p>
                        <p className="text-theme-on-accent mt-2 text-sm leading-7">
                          {error instanceof Error ? error.message : "Please try refreshing the page."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr className="border-t border-mint/10">
                    <td colSpan={7} className="px-6 py-14 text-center">
                      <div className="theme-card-soft mx-auto max-w-xl rounded-2xl border border-dashed px-6 py-8">
                        <p className="text-theme-heading text-lg font-semibold">No matching orders</p>
                        <p className="text-white/75 mt-2 text-sm leading-7">
                          Adjust the status filter or search text to see more results.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isExpanded = expandedId === order.id;
                    const isUpdating = updatingId === order.id && updateOrderMutation.isPending;

                    return (
                      <Fragment key={order.id}>
                        <tr
                          onClick={() =>
                            setExpandedId((currentExpandedId) =>
                              currentExpandedId === order.id ? null : order.id,
                            )
                          }
                          className="cursor-pointer border-t border-mint/10 align-top transition hover:bg-forest-dark/55"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-start gap-3">
                              <span className="text-theme-heading mt-1 rounded-full border border-gold/20 bg-gold/12 p-1">
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                />
                              </span>
                              <div>
                                <p className="text-theme-strong font-semibold">{order.id}</p>
                                <p className="text-white/75 mt-1 text-sm">
                                  {order.items.length} {order.items.length === 1 ? "item" : "items"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <p className="text-theme-strong font-semibold">{order.customer.name}</p>
                          </td>
                          <td className="text-theme-strong px-6 py-5 text-sm font-medium">
                            {order.customer.phone}
                          </td>
                          <td className="px-6 py-5">
                            <p className="text-white/75 max-w-[320px] text-sm leading-6">
                              {formatAddress(order)}
                            </p>
                          </td>
                          <td className="text-theme-heading px-6 py-5 text-sm font-semibold">
                            {formatCurrency(order.total)}
                          </td>
                          <td className="text-white/70 px-6 py-5 text-sm">
                            {formatDateTime(order.createdAt)}
                          </td>
                          <td className="px-6 py-5">
                            <div onClick={(event) => event.stopPropagation()}>
                              <select
                                value={order.status}
                                onChange={(event) =>
                                  void handleStatusChange(order.id, event.target.value as OrderStatus)
                                }
                                disabled={isUpdating}
                                className={`min-w-[170px] rounded-full border px-4 py-2.5 text-sm font-semibold outline-none transition ${STATUS_META[order.status].selectClassName} disabled:cursor-not-allowed disabled:opacity-70`}
                              >
                                {ORDER_STATUSES.map((status) => (
                                  <option key={status} value={status}>
                                    {STATUS_META[status].label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                        </tr>

                        {isExpanded ? (
                          <tr className="bg-forest-dark/55">
                            <td colSpan={7} className="px-6 pb-6 pt-0">
                              <div className="grid gap-4 border-t border-mint/10 pt-6 xl:grid-cols-[minmax(0,1.2fr)_340px]">
                                <div className="theme-card rounded-[1.5rem] border p-5 shadow-sm">
                                  <div className="flex items-center justify-between gap-4 border-b border-mint/10 pb-4">
                                    <div>
                                      <p className="text-theme-heading text-sm font-semibold uppercase tracking-[0.22em]">
                                        Order Details
                                      </p>
                                      <h2 className="text-theme-heading mt-2 text-xl font-semibold">
                                        Full items list
                                      </h2>
                                    </div>
                                    <span
                                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${STATUS_META[order.status].badgeClassName}`}
                                    >
                                      {STATUS_META[order.status].label}
                                    </span>
                                  </div>

                                  <div className="mt-5 space-y-3">
                                    {order.items.map((item, index) => (
                                      <div
                                        key={`${order.id}-${item.productId}-${item.weight}-${index}`}
                                        className="theme-card-soft grid gap-3 rounded-2xl border p-4 md:grid-cols-[minmax(0,1fr)_120px_90px_140px]"
                                      >
                                        <div>
                                          <p className="text-theme-strong font-semibold">{item.name}</p>
                                          <p className="text-white/75 mt-1 text-sm">
                                            Product ID: {item.productId}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-white/70 text-xs font-semibold uppercase tracking-[0.18em]">
                                            Weight
                                          </p>
                                          <p className="text-theme-strong mt-2 text-sm font-medium">
                                            {item.weight}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-white/70 text-xs font-semibold uppercase tracking-[0.18em]">
                                            Qty
                                          </p>
                                          <p className="text-theme-strong mt-2 text-sm font-medium">
                                            {item.quantity}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-white/70 text-xs font-semibold uppercase tracking-[0.18em]">
                                            Line Total
                                          </p>
                                          <p className="text-theme-heading mt-2 text-sm font-semibold">
                                            {formatCurrency(item.totalPrice)}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div className="theme-card rounded-[1.5rem] border p-5 shadow-sm">
                                    <p className="text-theme-heading text-sm font-semibold uppercase tracking-[0.22em]">
                                      Customer
                                    </p>
                                    <div className="text-white/75 mt-4 space-y-3 text-sm leading-7">
                                      <div>
                                        <p className="text-theme-strong font-semibold">{order.customer.name}</p>
                                        <p>{order.customer.phone}</p>
                                      </div>
                                      <div>
                                        <p className="text-theme-strong font-semibold">Delivery address</p>
                                        <p>{formatAddress(order)}</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="theme-card rounded-[1.5rem] border p-5 shadow-sm">
                                    <p className="text-theme-heading text-sm font-semibold uppercase tracking-[0.22em]">
                                      Totals
                                    </p>
                                    <div className="text-white/75 mt-4 space-y-3 text-sm">
                                      <div className="flex items-center justify-between gap-4">
                                        <span>Subtotal</span>
                                        <span className="text-theme-strong font-semibold">
                                          {formatCurrency(order.subtotal)}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between gap-4">
                                        <span>Shipping</span>
                                        <span className="text-theme-strong font-semibold">
                                          {formatCurrency(order.shipping ?? 0)}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between gap-4 border-t border-mint/10 pt-3">
                                        <span className="text-theme-strong font-semibold">Total</span>
                                        <span className="text-theme-heading font-semibold">
                                          {formatCurrency(order.total)}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between gap-4 border-t border-mint/10 pt-3">
                                        <span className="text-theme-strong font-semibold">Placed on</span>
                                        <span className="text-white/75 text-right">
                                          {formatDateTime(order.createdAt)}
                                        </span>
                                      </div>
                                    </div>

                                    {isUpdating ? (
                                      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold/15 px-4 py-2 text-sm font-semibold text-theme-heading">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Updating status
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
        )}
      </section>
    </main>
  );
};

export default AdminDashboardPage;
