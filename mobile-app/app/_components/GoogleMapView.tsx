import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface GoogleMapViewProps {
    latitude: number;
    longitude: number;
    zoom?: number;
    markerPosition?: { latitude: number; longitude: number } | null;
    markers?: Array<{ id: string | number; latitude: number; longitude: number; title?: string; color?: string; price?: number; rating?: number; category?: string }>;
    onMapPress?: (lat: number, lng: number) => void;
    onMarkerPress?: (id: string | number) => void;
    onMapReady?: () => void;
    scrollEnabled?: boolean;
    zoomEnabled?: boolean;
    style?: any;
    mapType?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
}

export interface GoogleMapMethods {
    animateToRegion: (lat: number, lng: number, zoom?: number) => void;
}

const GoogleMapView = React.forwardRef<GoogleMapMethods, GoogleMapViewProps>((props, ref) => {
    const {
        latitude,
        longitude,
        zoom = 15,
        markerPosition,
        markers = [],
        onMapPress,
        onMarkerPress,
        onMapReady,
        scrollEnabled = true,
        zoomEnabled = true,
        style,
        mapType = 'roadmap'
    } = props;
    
    const webViewRef = useRef<WebView>(null);

    React.useImperativeHandle(ref, () => ({
        animateToRegion: (lat: number, lng: number, zoom?: number) => {
            if (webViewRef.current) {
                webViewRef.current.postMessage(JSON.stringify({
                    type: 'ANIMATE_TO',
                    payload: { lat, lng, zoom }
                }));
            }
        }
    }));

    // Google Maps Tile Layers
    // m = Roadmap
    // s = Satellite
    // y = Hybrid
    // t = Terrain
    const getTileLayer = () => {
        switch(mapType) {
            case 'satellite': return 's';
            case 'hybrid': return 'y';
            case 'terrain': return 't';
            default: return 'm';
        }
    };

    const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script>
            window.onerror = function(message, source, lineno, colno, error) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'ERROR',
                    payload: { message: message, lineno: lineno, colno: colno }
                }));
                return true;
            };
        </script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
        <style>
            body { margin: 0; padding: 0; }
            #map { width: 100vw; height: 100vh; }
            .leaflet-control-attribution { display: none; }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            var map = L.map('map', {
                zoomControl: ${zoomEnabled},
                dragging: ${scrollEnabled},
                touchZoom: ${zoomEnabled},
                scrollWheelZoom: ${zoomEnabled}
            }).setView([${latitude}, ${longitude}], ${zoom});

            // Using Google Maps Tiles (Keyless HTTPS approach)
            L.tileLayer('https://{s}.google.com/vt/lyrs=${getTileLayer()}&hl=en&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
                attribution: '&copy; Google Maps'
            }).addTo(map);

            var singleMarker;
            if (${!!markerPosition}) {
                singleMarker = L.marker([${markerPosition?.latitude || 0}, ${markerPosition?.longitude || 0}]).addTo(map);
            }

            var multiMarkers = {};
            var markersData = ${JSON.stringify(markers)};
            markersData.forEach(function(m) {
                var marker = L.marker([m.latitude, m.longitude]).addTo(map);
                if (m.title) {
                    var categoryTag = m.category ? '<span style="background-color:#E0F2FE;color:#0369A1;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold;text-transform:uppercase;">' + m.category + '</span>' : '';
                    var priceTag = m.price ? '<div style="font-size:13px;font-weight:800;color:#0F766E;margin-top:4px;">PKR ' + m.price.toLocaleString() + '</div>' : '';
                    var ratingTag = m.rating ? '<div style="font-size:11px;font-weight:bold;color:#D97706;margin-top:2px;">★ ' + m.rating.toFixed(1) + '</div>' : '';
                    var detailsBtn = '<button onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:\\'ON_MARKER_PRESS\\',payload:{id:\\'' + m.id + '\\'}}))" style="background-color:#0284C7;color:#FFFFFF;border:none;padding:5px 10px;border-radius:6px;font-size:11px;font-weight:bold;margin-top:8px;cursor:pointer;width:100%;">View Details</button>';
                    
                    var popupContent = '<div style="font-family:sans-serif;min-width:140px;">' +
                        '<div style="font-size:14px;font-weight:bold;color:#1F2937;margin-bottom:2px;">' + m.title + '</div>' +
                        categoryTag + 
                        priceTag + 
                        ratingTag + 
                        detailsBtn +
                        '</div>';
                    
                    marker.bindPopup(popupContent);
                }
                marker.on('click', function() {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'ON_MARKER_PRESS',
                        payload: { id: m.id }
                    }));
                });
                multiMarkers[m.id] = marker;
            });

            map.on('click', function(e) {
                if (${!!onMapPress}) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'ON_PRESS',
                        payload: { lat: e.latlng.lat, lng: e.latlng.lng }
                    }));
                }
            });

            window.addEventListener('message', function(event) {
                var message = JSON.parse(event.data);
                if (message.type === 'SET_VIEW') {
                    map.setView([message.payload.lat, message.payload.lng], message.payload.zoom || map.getZoom());
                } else if (message.type === 'SET_MARKER') {
                    if (singleMarker) map.removeLayer(singleMarker);
                    singleMarker = L.marker([message.payload.lat, message.payload.lng]).addTo(map);
                } else if (message.type === 'UPDATE_MARKERS') {
                    Object.values(multiMarkers).forEach(m => map.removeLayer(m));
                    multiMarkers = {};
                    message.payload.markers.forEach(function(m) {
                        var marker = L.marker([m.latitude, m.longitude]).addTo(map);
                        if (m.title) {
                            var categoryTag = m.category ? '<span style="background-color:#E0F2FE;color:#0369A1;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold;text-transform:uppercase;">' + m.category + '</span>' : '';
                            var priceTag = m.price ? '<div style="font-size:13px;font-weight:800;color:#0F766E;margin-top:4px;">PKR ' + m.price.toLocaleString() + '</div>' : '';
                            var ratingTag = m.rating ? '<div style="font-size:11px;font-weight:bold;color:#D97706;margin-top:2px;">★ ' + m.rating.toFixed(1) + '</div>' : '';
                            var detailsBtn = '<button onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:\\'ON_MARKER_PRESS\\',payload:{id:\\'' + m.id + '\\'}}))" style="background-color:#0284C7;color:#FFFFFF;border:none;padding:5px 10px;border-radius:6px;font-size:11px;font-weight:bold;margin-top:8px;cursor:pointer;width:100%;">View Details</button>';
                            
                            var popupContent = '<div style="font-family:sans-serif;min-width:140px;">' +
                                '<div style="font-size:14px;font-weight:bold;color:#1F2937;margin-bottom:2px;">' + m.title + '</div>' +
                                categoryTag + 
                                priceTag + 
                                ratingTag + 
                                detailsBtn +
                                '</div>';
                            
                            marker.bindPopup(popupContent);
                        }
                        marker.on('click', function() {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'ON_MARKER_PRESS',
                                payload: { id: m.id }
                            }));
                        });
                        multiMarkers[m.id] = marker;
                    });
                } else if (message.type === 'ANIMATE_TO') {
                    map.flyTo([message.payload.lat, message.payload.lng], message.payload.zoom || map.getZoom(), {
                        duration: 1.5
                    });
                }
            });

            // Signal that map is ready
            setTimeout(function() {
                map.invalidateSize();
            }, 500);
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ON_READY' }));
        </script>
    </body>
    </html>
    `;

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'ON_PRESS' && onMapPress) {
                onMapPress(data.payload.lat, data.payload.lng);
            } else if (data.type === 'ON_MARKER_PRESS' && onMarkerPress) {
                onMarkerPress(data.payload.id);
            } else if (data.type === 'ON_READY' && onMapReady) {
                onMapReady();
            } else if (data.type === 'ERROR') {
                console.error("GoogleMapView WebView JS Error:", data.payload);
            }
        } catch (e) {
            console.warn("GoogleMap message error:", e);
        }
    };

    useEffect(() => {
        if (webViewRef.current) {
            webViewRef.current.postMessage(JSON.stringify({
                type: 'SET_VIEW',
                payload: { lat: latitude, lng: longitude }
            }));
            if (markerPosition) {
                webViewRef.current.postMessage(JSON.stringify({
                    type: 'SET_MARKER',
                    payload: { lat: markerPosition.latitude, lng: markerPosition.longitude }
                }));
            }
            if (markers.length > 0) {
                webViewRef.current.postMessage(JSON.stringify({
                    type: 'UPDATE_MARKERS',
                    payload: { markers: markers }
                }));
            }
        }
    }, [latitude, longitude, markerPosition, markers]);

    return (
        <View style={[styles.container, style]}>
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: mapHtml, baseUrl: 'http://localhost' }}
                onMessage={handleMessage}
                style={styles.map}
                scrollEnabled={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" color="#4285F4" />
                    </View>
                )}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
    },
    map: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    loading: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default GoogleMapView;
