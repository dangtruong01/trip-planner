"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useRef, useEffect } from "react";

// Fix for default markers in Next.js
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// Helper to handle flyTo and open popup
function ActiveLocationHandler({ location, markersRef }: { location: [number, number] | null, markersRef: React.MutableRefObject<any[]> }) {
    const map = useMap();
    useEffect(() => {
        if (location) {
            map.flyTo(location, 16, { // Slightly closer zoom for detail
                animate: true,
                duration: 1.5
            });

            // Find marker with this location and open popup
            const marker = markersRef.current.find(m => {
                if (!m) return false;
                const latLng = m.getLatLng();
                // Simple float comparison epsilon
                return Math.abs(latLng.lat - location[0]) < 0.0001 && Math.abs(latLng.lng - location[1]) < 0.0001;
            });

            if (marker) {
                marker.openPopup();
            }
        }
    }, [location, map, markersRef]);
    return null;
}

// Helper to fit bounds
function MapUpdater({ coordinates }: { coordinates: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
        if (coordinates.length > 0) {
            const bounds = L.latLngBounds(coordinates);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [coordinates, map]);
    return null;
}

export default function Map({ days, activeLocation, selectedDayIndex }: { days: any[]; activeLocation?: [number, number] | null; selectedDayIndex: number }) {
    const markersRef = useRef<any[]>([]);

    // Reset refs when days change
    useEffect(() => {
        markersRef.current = [];
    }, [days]);

    // Extract all coordinates for markers
    const allActivities = days.flatMap((d) => d.activities);
    const allCoords = allActivities
        .map((a) => a.coordinates)
        .filter((c) => c && c.lat && c.lng)
        .map((c) => [c.lat, c.lng] as [number, number]);

    // Extract coordinates for the selected day ONLY for the polyline
    const selectedDayActivities = days[selectedDayIndex]?.activities || [];
    const dayCoords = selectedDayActivities
        .map((a: any) => a.coordinates)
        .filter((c: any) => c && c.lat && c.lng)
        .map((c: any) => [c.lat, c.lng] as [number, number]);

    if (allCoords.length === 0) return <div className="h-full w-full flex items-center justify-center bg-primary/5 text-primary">No coordinates to display</div>;

    return (
        <MapContainer center={allCoords[0]} zoom={13} className="h-full w-full rounded-xl z-0" scrollWheelZoom={false}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            {/* Render ALL markers from all days so context is visible */}
            {allActivities.map((activity: any, idx: number) => {
                if (!activity.coordinates?.lat) return null;
                return (
                    <Marker
                        key={idx}
                        ref={(el) => { if (el) markersRef.current[idx] = el; }}
                        position={[activity.coordinates.lat, activity.coordinates.lng]}
                        icon={icon}
                    >
                        <Popup>
                            <div className="font-serif">
                                <h3 className="font-bold">{activity.place}</h3>
                                <p>{activity.description}</p>
                                <p className="text-xs text-gray-500">{activity.time}</p>
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.place + " " + (activity.address || ""))}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                                >
                                    View on Google Maps
                                </a>
                            </div>
                        </Popup>
                    </Marker>
                )
            })}

            {/* Render Polyline ONLY for the selected day */}
            {dayCoords.length > 1 && <Polyline positions={dayCoords} color="#8B0000" dashArray="5, 10" />}

            {/* Fit bounds to ALL coords so the full trip is visible initially, or maybe just the day? 
                User asked to "display the nodes" implying full context. 
                But might be better to fit bounds to the selected Day if we want focus.
                User said "zooms onto the location" when clicked.
                Let's fit bounds to the whole trip initially.
            */}
            <MapUpdater coordinates={allCoords} />
            <ActiveLocationHandler location={activeLocation ?? null} markersRef={markersRef} />
        </MapContainer>
    );
}
