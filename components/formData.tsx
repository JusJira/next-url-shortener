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
import { useState } from "react";
import copy from "copy-to-clipboard";

const reservedSlugs = ["https://imjustin.dev"];

const formSchema = z.object({
  url: z
    .string()
    .url()
    .refine((url) => !reservedSlugs.includes(url), {
      message: "Invalid URL",
    }),
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

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const response = await fetch("/api/shortURL", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: values.url,
      }),
    });

    if (response?.ok) {
      setIsLoading(false);
      setSubmitted(true);
      setUrl(await response.text());
      return toast("Success", {
        description: "Your link has been shortened",
      });
    }
  }
  if (!submitted) {
    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 w-[300px]"
        >
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
                <FormDescription>Shortened URL will expire in 24 hours</FormDescription>
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
          <p className="text-center text-sm text-muted-foreground">This link will expire in 24 hours</p>
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
