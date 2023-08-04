import { getLinkViaEdge } from "#/lib/planetscale";
import { unescape } from "html-escaper";
import { constructMetadata, getApexDomain } from "#/lib/utils";
import { notFound, redirect } from "next/navigation";
import { GOOGLE_FAVICON_URL } from "#/lib/constants";

export const runtime = "edge";

export async function generateMetadata({
  params,
}: {
  params: { domain: string; key: string };
}) {
  const data = await getLinkViaEdge(params.domain, params.key);

  if (!data || data.proxy === 0) {
    return;
  }

  const apexDomain = getApexDomain(data.url);

  return constructMetadata({
    title: unescape(data.title),
    description: unescape(data.description),
    image: unescape(data.image),
    icons: `${GOOGLE_FAVICON_URL}${unescape(apexDomain)}`,
  });
}

export default async function ProxyOGPage({
  params,
}: {
  params: { domain: string; key: string };
}) {
  const data = await getLinkViaEdge(params.domain, params.key);

  // if the link doesn't exist
  if (!data) {
    notFound();

    // if the link does not have proxy enabled, redirect to the original URL
  } else if (data.proxy === 0) {
    redirect(data.url);
  }

  const apexDomain = getApexDomain(data.url);

  return (
    <main className="flex h-screen w-screen items-center justify-center">
      <div className="mx-5 w-full max-w-lg overflow-hidden rounded-lg border border-gray-200 sm:mx-0">
        <img
          src={unescape(data.image)}
          alt={unescape(data.title)}
          className="w-full object-cover"
        />
        <div className="flex space-x-3 bg-gray-100 p-5">
          <img
            src={`${GOOGLE_FAVICON_URL}${unescape(apexDomain)}`}
            alt={unescape(data.title)}
            className="mt-1 h-6 w-6"
          />
          <div className="flex flex-col space-y-3">
            <h1 className="font-bold text-gray-700">{unescape(data.title)}</h1>
            <p className="text-sm text-gray-500">
              {unescape(data.description)}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
