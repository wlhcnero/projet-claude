import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      restaurantId: string;
      tableNumber: string;
      totalAmount: number;
      customerNotes: string | null;
      items: { itemId: string; itemName: string; itemPrice: number; quantity: number }[];
    };

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const orderId = crypto.randomUUID();

    const { error: orderError } = await supabase.from("orders").insert({
      id: orderId,
      restaurant_id: body.restaurantId,
      table_number: body.tableNumber,
      status: "pending",
      total_amount: body.totalAmount,
      customer_notes: body.customerNotes,
    });

    if (orderError) {
      return NextResponse.json(
        { error: orderError.message, code: orderError.code, hint: orderError.hint, details: orderError.details },
        { status: 400 }
      );
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      body.items.map((item) => ({
        order_id: orderId,
        item_id: item.itemId,
        item_name: item.itemName,
        item_price: item.itemPrice,
        quantity: item.quantity,
      }))
    );

    if (itemsError) {
      return NextResponse.json(
        { error: itemsError.message, code: itemsError.code, hint: itemsError.hint, details: itemsError.details },
        { status: 400 }
      );
    }

    return NextResponse.json({ orderId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
