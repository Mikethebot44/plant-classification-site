import { Client } from "@gradio/client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const HF_SPACE_ID = "juppy44/plant-classification";
const MAX_TOP_K = 10;
const DEFAULT_TOP_K = 5;
const MAX_ADAPTERS = 5;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const { imageUrl, topK, adapters } = body as {
      imageUrl?: string;
      topK?: number;
      adapters?: string[];
    };

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { error: "imageUrl is required and must be a string." },
        { status: 400 }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      return NextResponse.json(
        { error: "imageUrl must be a valid URL." },
        { status: 400 }
      );
    }

    let finalTopK = DEFAULT_TOP_K;
    if (typeof topK === "number") {
      if (!Number.isFinite(topK) || topK <= 0) {
        return NextResponse.json(
          { error: "topK must be a positive number." },
          { status: 400 }
        );
      }
      finalTopK = Math.min(Math.floor(topK), MAX_TOP_K);
    }

    let finalAdapters: string[] = ["base"];
    if (Array.isArray(adapters)) {
      if (adapters.length === 0) {
        finalAdapters = ["base"];
      } else if (adapters.length > MAX_ADAPTERS) {
        return NextResponse.json(
          { error: `adapters cannot have more than ${MAX_ADAPTERS} items.` },
          { status: 400 }
        );
      } else {
        finalAdapters = adapters
          .map((adapter) => String(adapter).trim())
          .filter((adapter) => adapter.length > 0);

        if (finalAdapters.length === 0) {
          finalAdapters = ["base"];
        }
      }
    }

    const useWaAdapter = finalAdapters.some((adapter) => {
      const normalised = adapter.toLowerCase();
      return normalised === "wa" || normalised === "wa-native";
    });

    const imageResponse = await fetch(parsedUrl.toString());
    if (!imageResponse.ok) {
      return NextResponse.json(
        {
          error: `Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`,
        },
        { status: 400 }
      );
    }
    const imageBlob = await imageResponse.blob();

    const client = await Client.connect(HF_SPACE_ID);
    const result = await client.predict("/classify_plant", {
      image: imageBlob,
      top_k: finalTopK,
      use_wa_adapter: useWaAdapter,
    });

    const rawPredictions = Array.isArray((result as any).data)
      ? (result as any).data
      : [];

    const predictions = rawPredictions.map((prediction: any, index: number) => ({
      label: String(prediction.label ?? prediction[0] ?? "unknown"),
      score: Number(prediction.score ?? prediction[1] ?? 0),
      rank: index + 1,
    }));

    return NextResponse.json(
      {
        model: "juppy44/plant-identification-2m-vit-b-wa",
        topK: finalTopK,
        adapters: finalAdapters,
        predictions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /api/classify:", error);
    return NextResponse.json(
      { error: "Internal server error while classifying image." },
      { status: 500 }
    );
  }
}
