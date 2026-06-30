// app/pos-settings/components/ArchivedProductsModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArchiveRestore, PackageOpen, X, Calendar } from "lucide-react";
import { Product, Category } from "../types";
import { createClient } from "@/app/lib/supabase/client";
import { toast } from "sonner";

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

  const filteredProducts = archivedProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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

  return (
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
          <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-[#826F69] text-sm">
                  Loading archived products...
                </p>
              </div>
            ) : archivedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
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
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#FFFBF8] hover:bg-[#FFFBF8]">
                    <TableHead className="text-[#3A2B27] font-semibold">
                      Product Name
                    </TableHead>
                    <TableHead className="text-[#3A2B27] font-semibold">
                      Category
                    </TableHead>
                    <TableHead className="text-[#3A2B27] font-semibold">
                      Type
                    </TableHead>
                    <TableHead className="text-[#3A2B27] font-semibold">
                      Archived Date
                    </TableHead>
                    <TableHead className="text-right text-[#3A2B27] font-semibold">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id} className="hover:bg-[#FFFBF8]">
                      <TableCell className="font-medium text-[#3A2B27]">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-[#826F69]">
                        {getCategoryName(product.categoryId)}
                      </TableCell>
                      <TableCell className="text-[#826F69] capitalize">
                        {product.type || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-[#826F69]">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-sm">
                            {product.archivedAt
                              ? formatDate(product.archivedAt)
                              : "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#C2456A]/30 text-[#C2456A] hover:bg-[#FBE4EA] hover:text-[#C2456A] hover:border-[#C2456A] transition-colors"
                          onClick={() => handleUnarchive(product.id)}
                          disabled={restoringId === product.id}
                        >
                          <ArchiveRestore className="w-4 h-4 mr-1.5" />
                          {restoringId === product.id
                            ? "Restoring..."
                            : "Restore"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Footer Stats */}
          {!loading && archivedProducts.length > 0 && (
            <div className="flex items-center justify-between text-sm text-[#826F69] border-t border-gray-200 pt-4">
              <span>
                {filteredProducts.length} of {archivedProducts.length} archived
                products
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
  );
}
