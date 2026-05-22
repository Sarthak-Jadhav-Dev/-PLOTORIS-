import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getEmbeddings } from "@/lib/ai-provider";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("Documents")
      .select("metadata")
      .eq("metadata->>project_id", projectId)
      .eq("metadata->>type", "saved_variable");

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: "Failed to fetch saved variables." }, { status: 500 });
    }

    const variables = data.map(d => d.metadata);
    return NextResponse.json({ variables });

  } catch (error: any) {
    console.error("Fetch saved variables error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { project_id, iv, dv, relationship, citation, validation, id: providedId } = body;

    if (!project_id || !iv || !dv || !relationship) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const id = providedId || crypto.randomUUID();
    const embeddings = getEmbeddings(req);
    const textToEmbed = `Independent Variable: ${iv}\nDependent Variable: ${dv}\nRelationship: ${relationship}\nCitation: ${citation || 'Custom'}\nValidation: ${validation || 'None'}`;
    const vector = await embeddings.embedQuery(textToEmbed);

    const { error } = await supabase.from("Documents").insert({
      content: textToEmbed,
      embedding: vector,
      metadata: {
        id,
        project_id,
        phase: 3,
        type: "saved_variable",
        iv,
        dv,
        relationship,
        citation: citation || "Custom Input",
        validation: validation || "Manually added by user."
      }
    });

    if (error) {
      console.error("Supabase Insert Error:", error);
      return NextResponse.json({ error: "Failed to save variable." }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("Save variable error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("Documents")
      .delete()
      .eq("metadata->>id", id)
      .eq("metadata->>type", "saved_variable");

    if (error) {
      console.error("Supabase Delete Error:", error);
      return NextResponse.json({ error: "Failed to delete variable." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete variable error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
