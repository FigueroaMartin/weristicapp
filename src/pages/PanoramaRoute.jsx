import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../supabaseClient'
import { usePerson } from '../PersonContext'

// Distancia en metros entre dos coordenadas (fórmula de haversine).
function distanceM(a, b) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

const formatDistance = (m) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`)

const directionsUrl = (stop) =>
  `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}&travelmode=walking`

function stopIcon(number, state) {
  return L.divIcon({
    className: '',
    html: `<div class="route-marker route-marker-${state}">${state === 'done' ? '✓' : number}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

const meIcon = L.divIcon({ className: '', html: '<div class="route-me"></div>', iconSize: [18, 18], iconAnchor: [9, 9] })

export default function PanoramaRoute({ panorama, onBack, onChanged }) {
  const { person } = usePerson()
  const [stops, setStops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [focusId, setFocusId] = useState(null)
  const [tracking, setTracking] = useState(false)
  const [me, setMe] = useState(null)
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  const meMarkerRef = useRef(null)

  const load = async () => {
    const { data, error } = await supabase
      .from('panorama_stops')
      .select('*')
      .eq('panorama_id', panorama.id)
      .order('position')
    if (error) setError(error.message)
    else setStops(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [panorama.id])

  const located = stops.filter((s) => s.lat != null && s.lng != null)
  const doneCount = stops.filter((s) => s.done).length
  const percent = stops.length ? Math.round((doneCount / stops.length) * 100) : 0
  const next = stops.find((s) => !s.done)

  // Crear el mapa una sola vez.
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return
    const map = L.map(mapEl.current, { zoomControl: true, attributionControl: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    map.setView([-33.44, -70.68], 15)
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [loading])

  // Dibujar paradas y el recorrido.
  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    layer.clearLayers()
    if (located.length === 0) return
    const points = located.map((s) => [s.lat, s.lng])
    L.polyline(points, { className: 'route-line', weight: 4, opacity: 0.7, dashArray: '6 8' }).addTo(layer)
    located.forEach((s) => {
      const state = s.done ? 'done' : next && s.id === next.id ? 'next' : 'todo'
      L.marker([s.lat, s.lng], { icon: stopIcon(s.position, state) })
        .bindTooltip(s.name)
        .on('click', () => setFocusId(s.id))
        .addTo(layer)
    })
    if (!focusId) map.fitBounds(points, { padding: [24, 24] })
  }, [stops])

  useEffect(() => {
    const stop = stops.find((s) => s.id === focusId)
    if (stop && stop.lat != null && mapRef.current) mapRef.current.setView([stop.lat, stop.lng], 17)
  }, [focusId])

  // Ubicación en vivo.
  useEffect(() => {
    if (!tracking) return
    if (!navigator.geolocation) { setError('Tu navegador no permite obtener la ubicación.'); setTracking(false); return }
    const id = navigator.geolocation.watchPosition(
      (pos) => setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { setError('No se pudo obtener tu ubicación. Revisa los permisos.'); setTracking(false) },
      { enableHighAccuracy: true, maximumAge: 10000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [tracking])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!tracking || !me) {
      if (meMarkerRef.current) { meMarkerRef.current.remove(); meMarkerRef.current = null }
      return
    }
    if (meMarkerRef.current) meMarkerRef.current.setLatLng([me.lat, me.lng])
    else meMarkerRef.current = L.marker([me.lat, me.lng], { icon: meIcon, zIndexOffset: 1000 }).bindTooltip('Estás aquí').addTo(map)
  }, [me, tracking])

  const toggleStop = async (stop) => {
    const done = !stop.done
    setStops((prev) => prev.map((s) => (s.id === stop.id ? { ...s, done } : s)))
    const { error } = await supabase
      .from('panorama_stops')
      .update({ done, done_at: done ? new Date().toISOString() : null, done_by: done ? person || null : null })
      .eq('id', stop.id)
    if (error) { setError(error.message); load(); return }
    onChanged?.()
  }

  const finishPanorama = async () => {
    const { error } = await supabase
      .from('panoramas')
      .update({ status: 'hecho', done_at: new Date().toISOString() })
      .eq('id', panorama.id)
    if (error) { setError(error.message); return }
    onChanged?.()
    onBack()
  }

  const centerOnMe = () => {
    if (me && mapRef.current) mapRef.current.setView([me.lat, me.lng], 17)
  }

  return (
    <div className="page">
      <div className="page-heading-row">
        <button type="button" className="link-btn" onClick={onBack}>← Volver</button>
      </div>
      <h2>{panorama.title}</h2>
      {panorama.notes && <p className="meta">{panorama.notes}</p>}

      <div className="balance-card">
        <span className="balance-label">Ruta completada</span>
        <span className="balance-amount">{percent}%</span>
        <div className="route-progress"><div className="route-progress-fill" style={{ width: `${percent}%` }} /></div>
        <div className="balance-breakdown">
          <div className="balance-row">
            <span>{doneCount} de {stops.length} paradas</span>
            {next && <span>Siguiente: <strong>{next.name}</strong></span>}
          </div>
          {tracking && me && next && next.lat != null && (
            <div className="balance-row">
              <span>Distancia a la siguiente parada</span>
              <strong>{formatDistance(distanceM(me, next))}</strong>
            </div>
          )}
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? <p>Cargando ruta…</p> : (
        <div className="page-grid">
          <div className="col-form">
            {located.length > 0 && (
              <div className="card route-map-card">
                <div ref={mapEl} className="route-map" />
                <div className="route-map-actions">
                  <button type="button" className={`chip ${tracking ? 'chip-on' : ''}`} onClick={() => setTracking((v) => !v)}>
                    📍 {tracking ? 'Ocultar mi ubicación' : 'Mostrar mi ubicación'}
                  </button>
                  {tracking && me && <button type="button" className="chip" onClick={centerOnMe}>🎯 Centrar en mí</button>}
                </div>
                <p className="meta">Ubicaciones aproximadas. Usa “Cómo llegar” para navegar con Google Maps.</p>
              </div>
            )}
            {percent === 100 && panorama.status !== 'hecho' && (
              <button type="button" className="primary" onClick={finishPanorama}>🎉 ¡Ruta completa! Marcar panorama como hecho</button>
            )}
          </div>

          <div className="col-list">
            <h3>Paradas</h3>
            {stops.length === 0 && <p className="empty">Este panorama no tiene ruta.</p>}
            <ol className="route-stops">
              {stops.map((s) => {
                const state = s.done ? 'done' : next && s.id === next.id ? 'next' : 'todo'
                return (
                  <li key={s.id} className={`route-stop route-stop-${state} ${focusId === s.id ? 'focused' : ''}`}>
                    <button
                      type="button"
                      className="route-check"
                      onClick={() => toggleStop(s)}
                      aria-label={s.done ? 'Marcar como pendiente' : 'Marcar como visitada'}
                    >
                      {s.done ? '✓' : s.position}
                    </button>
                    <div className="route-stop-body" onClick={() => setFocusId(s.id)}>
                      <strong>{s.name}</strong>
                      <div className="meta">
                        {s.planned_time && `${s.planned_time}`}
                        {s.duration_min ? ` · ${s.duration_min} min` : ''}
                        {tracking && me && s.lat != null ? ` · a ${formatDistance(distanceM(me, s))}` : ''}
                        {s.done && s.done_by ? ` · ✓ ${s.done_by}` : ''}
                      </div>
                      {s.description && <div className="meta">{s.description}</div>}
                      {s.lat != null && (
                        <a className="route-link" href={directionsUrl(s)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                          🧭 Cómo llegar
                        </a>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}
