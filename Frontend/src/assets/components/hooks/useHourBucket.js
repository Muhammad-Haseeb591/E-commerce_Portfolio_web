import { useEffect, useState } from "react"
import { getHourBucket } from "../../../utils/random"

// Re-renders once the wall clock moves into a new hour (checked every
// minute — cheap, no need for a per-second timer).
export function useHourBucket() {
  const [bucket, setBucket] = useState(getHourBucket())
  useEffect(() => {
    const id = setInterval(() => {
      const current = getHourBucket()
      setBucket((prev) => (prev !== current ? current : prev))
    }, 60 * 1000)
    return () => clearInterval(id)
  }, [])
  return bucket
}
