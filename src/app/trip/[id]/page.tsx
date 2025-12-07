import TripClientView from "@/components/TripClientView";

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <TripClientView id={id} />;
}
