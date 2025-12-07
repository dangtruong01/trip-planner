"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

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

// Helper to handle flyTo
function ActiveLocationHandler({ location }: { location: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (location) {
            map.flyTo(location, 15, {
                animate: true,
                duration: 1.5
            });
        }
    }, [location, map]);
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

export default function Map({ days, activeLocation }: { days: any[]; activeLocation?: [number, number] | null }) {
    // Extract all coordinates
    const allActivities = days.flatMap((d) => d.activities);
    const coords = allActivities
        .map((a) => a.coordinates)
        .filter((c) => c && c.lat && c.lng)
        .map((c) => [c.lat, c.lng] as [number, number]);

    if (coords.length === 0) return <div className="h-full w-full flex items-center justify-center bg-primary/5 text-primary">No coordinates to display</div>;

    return (
        <MapContainer center={coords[0]} zoom={13} className="h-full w-full rounded-xl z-0" scrollWheelZoom={false}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            {allActivities.map((activity: any, idx: number) => {
                if (!activity.coordinates?.lat) return null;
                return (
                    <Marker
                        key={idx}
                        position={[activity.coordinates.lat, activity.coordinates.lng]}
                        icon={icon} // We need to fix icon loading or use default
                    >
                        <Popup>
                            <div className="font-serif">
                                <h3 className="font-bold">{activity.place}</h3>
                                <p>{activity.description}</p>
                                <p className="text-xs text-gray-500">{activity.time}</p>
                            </div>
                        </Popup>
                    </Marker>
                )
            })}

            {coords.length > 1 && <Polyline positions={coords} color="#8B0000" dashArray="5, 10" />}

            <MapUpdater coordinates={coords} />
            <ActiveLocationHandler location={activeLocation ?? null} />
        </MapContainer>
    );
}
