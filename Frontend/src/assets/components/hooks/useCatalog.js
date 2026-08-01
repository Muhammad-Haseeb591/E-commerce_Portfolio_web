import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchCatalog } from "../store/fetcherSlice"

/* ------------------------------------------------------------------ */
/*  Shared catalog fetch — used by BOTH CategoryGrid and LiveStock so   */
/*  there's exactly one fetchCatalog() dispatch, not a race between two */
/* ------------------------------------------------------------------ */

export function useCatalog() {
  const dispatch = useDispatch()
  const catalog = useSelector((state) => state.FetchPrducts?.catalog ?? [])
  const catalogLoading = useSelector((state) => state.FetchPrducts?.catalogLoading ?? false)

  useEffect(() => {
    if (catalog.length === 0 && !catalogLoading) {
      dispatch(fetchCatalog())
    }
  }, [dispatch, catalog.length, catalogLoading])

  return { catalog, catalogLoading }
}
