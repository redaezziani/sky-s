"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});




interface DeliveryMapPickerProps {
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryPlace?: string;
  readonly?: boolean; // if true, only show marker, no picking
  onChange?: (data: { lat: number; lng: number; place: string }) => void;
  className?: string;
  height?: string | number;
  defaultCenter?: [number, number];
  zoom?: number;
}

export default function DeliveryMapPicker({
  deliveryLat,
  deliveryLng,
  deliveryPlace,
  readonly = false,
  onChange,
  className = "",
  height = "400px",
  defaultCenter = [33.5731, -7.5898], // default to Kénitra
  zoom = 13,
}: DeliveryMapPickerProps) {
  const [lat, setLat] = useState(deliveryLat || defaultCenter[0]);
  const [lng, setLng] = useState(deliveryLng || defaultCenter[1]);
  const [place, setPlace] = useState(deliveryPlace || "");

  useEffect(() => {
    if (deliveryLat && deliveryLng) {
      setLat(deliveryLat);
      setLng(deliveryLng);
      setPlace(deliveryPlace || "");
    }
  }, [deliveryLat, deliveryLng, deliveryPlace]);

  function LocationMarker() {
    useMapEvents({
      click(e) {
        if (readonly) return;
        setLat(e.latlng.lat);
        setLng(e.latlng.lng);
        const placeStr = `Lat: ${e.latlng.lat.toFixed(
          5
        )}, Lng: ${e.latlng.lng.toFixed(5)}`;
        setPlace(placeStr);
        onChange?.({ lat: e.latlng.lat, lng: e.latlng.lng, place: placeStr });
      },
    });

    return (
      <Marker
        position={[lat, lng]}
        draggable={!readonly}
        eventHandlers={{
          dragend: (e) => {
            if (readonly) return;
            const marker = e.target;
            const pos = marker.getLatLng();
            setLat(pos.lat);
            setLng(pos.lng);
            const placeStr = `Lat: ${pos.lat.toFixed(
              5
            )}, Lng: ${pos.lng.toFixed(5)}`;
            setPlace(placeStr);
            onChange?.({ lat: pos.lat, lng: pos.lng, place: placeStr });
          },
        }}
      />
    );
  }

  return (
    <div className={className}>
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        scrollWheelZoom={!readonly}
        style={{ height, width: "100%", borderRadius: 8 }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">Roads</a>'
        />
        <LocationMarker />
      </MapContainer>
      <div className="mt-2 text-sm text-muted-foreground">
        {place
          ? `Selected Location: ${place}`
          : readonly
          ? "No location selected"
          : "Click on the map to select location"}
      </div>
    </div>
  );
}
