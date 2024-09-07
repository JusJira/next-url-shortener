"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import copy from "copy-to-clipboard";
import QRCode from "react-qr-code";
import { useFormState } from "react-dom";
import { CreateURL, State } from "@/actions/actions";

export const runtime = "edge";

const formSchema = z.object({
  url: z.string().url(),
});

export function URLForm() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [url, setUrl] = useState("");
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
    },
  });

  const [state, formAction] = useFormState<State, FormData>(CreateURL, null);
  useEffect(() => {
    if (!state) {
      return;
    }
    if (state.status === "error") {
      console.log("error", state.errors);
    }
    if (state.status === "success") {
      setSubmitted(true);
      setUrl(state.message);
      toast("Success", {
        description: "Your link has been shortened",
      });
    }
  }, [state]);

  const onImageDownload = () => {
    const svg = document.getElementById("QRCode");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = "QRCode";
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      };
      img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
    }
  };

  if (!submitted) {
    return (
      <Form {...form}>
        <form action={formAction} className="w-[300px] space-y-8">
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL to Shorten</FormLabel>
                <FormControl>
                  <Input placeholder="https://google.com" {...field} />
                </FormControl>
                <FormMessage />
                <FormDescription>
                  Shortened URL will expire in 24 hours
                </FormDescription>
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading} className="w-full">
            Submit
          </Button>
        </form>
      </Form>
    );
  } else {
    return (
      <div className="w-[300px] space-y-8">
        <p className="text-center text-lg font-semibold">
          Here is your shortened url
        </p>
        <div className="space-y-1">
          <div className="flex w-full max-w-lg items-center space-x-4">
            <Input type="url" value={url} />
            <Button
              onClick={() => {
                toast("Link Copied", {
                  description: "Link has been copied to your clipboard.",
                });
                copy(url);
              }}
            >
              Copy
            </Button>
          </div>
          <p className="text-muted-foreground text-center text-sm">
            This link will expire in 24 hours
          </p>
          <div className="flex flex-col items-center justify-center gap-4">
            <QRCode
              value={url}
              id="QRCode"
              className="m-auto rounded-sm border-8"
            />
            <Button className="m-auto" onClick={onImageDownload}>
              Download
            </Button>
          </div>
        </div>
        <div>
          <Button
            onClick={() => {
              setSubmitted(false);
              form.reset();
            }}
            className="w-full"
          >
            Back
          </Button>
        </div>
      </div>
    );
  }
}
