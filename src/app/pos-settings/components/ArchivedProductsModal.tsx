"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArchiveRestore, PackageOpen, X, Trash2 } from "lucide-react";
import { Product, Category } from "../types";
import { createClient } from "@/app/lib/supabase/client";
import { toast } from "sonner";
import { deleteImage } from "@/app/lib/supabase/storage";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  GridReadyEvent,
  GridApi,
  ModuleRegistry,
  AllCommunityModule,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AuthorizationModal } from "@/app/sales/components/authorization-modal";

ModuleRegistry.registerModules([AllCommunityModule]);

interface ArchivedProductsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnarchive: (productId: string) => Promise<void>;
  categories: Category[];
}

export function ArchivedProductsModal({
  open,
  onOpenChange,
  onUnarchive,
  categories,
}: ArchivedProductsModalProps) {
  const [archivedProducts, setArchivedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    actionType: "edit" | "delete";
    targetProduct?: Product;
  }>({
    isOpen: false,
    actionType: "delete",
  });

  const fetchArchivedProducts = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          id,
          name,
          category_id,
          type,
          description,
          image_url,
          has_recipe,
          is_visible,
          archived_at,
          created_at,
          updated_at
        `,
        )
        .not("archived_at", "is", null)
        .order("archived_at", { ascending: false });

      if (error) {
        console.error("Error fetching archived products:", error);
        toast.error("Failed to load archived products");
        return;
      }

      // Convert to Product type
      const products: Product[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        categoryId: row.category_id,
        type: row.type,
        image: row.image_url ?? undefined,
        description: row.description ?? undefined,
        hasRecipe: row.has_recipe,
        isVisible: row.is_visible,
        archivedAt: row.archived_at,
        sizes: [],
        temperatures: [],
        prices: {},
        recipes: {},
      }));

      setArchivedProducts(products);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load archived products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchArchivedProducts();
    }
  }, [open]);

  const handleUnarchive = async (productId: string) => {
    setRestoringId(productId);
    try {
      await onUnarchive(productId);
      // Remove from local list
      setArchivedProducts((prev) => prev.filter((p) => p.id !== productId));
      toast.success("Product Restored", {
        description: "The product has been restored to the active catalog.",
      });
    } catch (error) {
      console.error("Error unarchiving product:", error);
      toast.error("Failed to restore product");
    } finally {
      setRestoringId(null);
    }
  };

  const requestDelete = (product: Product) => {
    setAuthModal({
      isOpen: true,
      actionType: "delete",
      targetProduct: product,
    });
  };

  const handleDeleteAuthorized = async () => {
    const { targetProduct } = authModal;
    if (!targetProduct) return;

    const supabase = createClient();

    if (targetProduct.image) {
      try {
        await deleteImage(targetProduct.image);
      } catch (error) {
        console.error("Failed to delete product image:", error);
      }
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", targetProduct.id);

    if (error) {
      toast.error(`Failed to delete product: ${error.message}`);
      setAuthModal({ isOpen: false, actionType: "delete" });
      return;
    }

    toast.success("Product permanently deleted.");
    setArchivedProducts((prev) =>
      prev.filter((p) => p.id !== targetProduct.id)
    );
    setAuthModal({ isOpen: false, actionType: "delete" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "Uncategorized";
  };

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  };

  useEffect(() => {
    if (gridApi) {
      gridApi.setGridOption("quickFilterText", searchQuery);
    }
  }, [searchQuery, gridApi]);

  const colDefs = React.useMemo<ColDef<Product>[]>(
    () => [
      {
        field: "name",
        headerName: "Product Name",
        flex: 1,
        minWidth: 200,
      },
      {
        field: "categoryId",
        headerName: "Category",
        valueGetter: (params) =>
          getCategoryName(params.data?.categoryId || ""),
        minWidth: 150,
      },
      {
        field: "type",
        headerName: "Type",
        valueFormatter: (params) =>
          params.value
            ? params.value.charAt(0).toUpperCase() + params.value.slice(1)
            : "—",
        minWidth: 120,
      },
      {
        field: "archivedAt",
        headerName: "Archived Date",
        valueFormatter: (params) =>
          params.value ? formatDate(params.value) : "—",
        minWidth: 180,
      },
      {
        headerName: "Action",
        pinned: "right",
        width: 180,
        minWidth: 180,
        maxWidth: 180,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          if (!params.data) return null;
          return (
            <div className="flex items-center gap-2 h-full">
              <Button
                variant="outline"
                size="sm"
                className="border-[#C2456A]/30 text-[#C2456A] hover:bg-[#FBE4EA] hover:text-[#C2456A] hover:border-[#C2456A] transition-colors"
                onClick={() => handleUnarchive(params.data.id)}
                disabled={restoringId === params.data.id}
              >
                <ArchiveRestore className="w-4 h-4 mr-1.5" />
                {restoringId === params.data.id ? "Restoring..." : "Restore"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => requestDelete(params.data)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [restoringId, categories]
  );

  const defaultColDef = React.useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      suppressMovable: true,
    }),
    []
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[90vw] w-[90vw] lg:max-w-[80vw] lg:w-[80vw] xl:max-w-[70vw] xl:w-[70vw] max-h-[90vh] flex flex-col bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#3A2B27]">
              Archived Products
            </DialogTitle>
            <DialogDescription className="text-[#826F69]">
              Products that have been archived will not appear in the active POS
              catalog. Restore them to make them available again.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col flex-1 min-h-0 gap-4">
            {/* Search Bar */}
            <div className="relative flex-1 sm:flex-none sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#826F69] pointer-events-none" />
              <Input
                placeholder="Search archived products..."
                className="pl-9 h-9 text-sm bg-white border-gray-200 focus:border-[#C2456A] focus:ring-[#C2456A]/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Products Table */}
            <div className="flex-1 min-h-[400px] w-full border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[#826F69] text-sm">
                    Loading archived products...
                  </p>
                </div>
              ) : archivedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="p-4 bg-[#FBE4EA]/50 rounded-full">
                    <PackageOpen className="w-8 h-8 text-[#C2456A]" />
                  </div>
                  <div className="text-center">
                    <p className="text-[#3A2B27] font-medium">
                      No archived products
                    </p>
                    <p className="text-[#826F69] text-sm">
                      Archived products will appear here for restoration.
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className="ag-theme-quartz"
                  style={{ height: 400, width: "100%" }}
                >
                  <AgGridReact
                    modules={[AllCommunityModule]}
                    theme="legacy"
                    rowData={archivedProducts}
                    columnDefs={colDefs}
                    defaultColDef={defaultColDef}
                    onGridReady={onGridReady}
                    rowHeight={56}
                    headerHeight={48}
                    suppressCellFocus={true}
                  />
                </div>
              )}
            </div>

            {/* Footer Stats */}
            {!loading && archivedProducts.length > 0 && (
              <div className="flex items-center justify-between text-sm text-[#826F69] border-t border-gray-200 pt-4">
                <span>
                  {/* Using the filtered count here correctly requires us to compute it, but since we use AG grid quick filter, we can't easily get it directly unless we track filtered count. For now we will just show total length. */}
                  Total {archivedProducts.length} archived products
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#826F69] hover:text-[#C2456A]"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear search
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <AuthorizationModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ isOpen: false, actionType: "delete" })}
        onAuthorize={handleDeleteAuthorized}
        actionType="delete"
        customTitle="Authorize Permanent Deletion"
        customDescription={
          <span className="space-y-2 block">
            <span className="block">
              Deleting a product permanently will remove it from the database entirely. This will also permanently delete any associated recipes and variants.
            </span>
            <span className="font-semibold text-foreground block">
              This action cannot be undone. All deletions will be recorded in the audit logs.
            </span>
          </span>
        }
      />
    </>
  );
}
