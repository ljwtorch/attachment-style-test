import { useEffect, useState } from "react";

const ANNOUNCEMENTS_ENDPOINT = "https://123262.xyz/announcements";
const ANNOUNCEMENT_EXIT_DURATION_MS = 240;

type AnnouncementItem = {
  id?: string;
  title?: string;
  content?: string;
  sites?: string | string[];
};

type AnnouncementApiResponse = {
  announcements?: AnnouncementItem[];
};

type NormalizedAnnouncement = {
  id: string;
  title: string;
  content: string;
};

export type AnnouncementModalProps = {
  open: boolean;
  onClose: () => void;
};

function normalizeSites(sites: AnnouncementItem["sites"]) {
  if (typeof sites === "string") {
    return [sites];
  }

  if (Array.isArray(sites)) {
    return sites.filter((site): site is string => typeof site === "string");
  }

  return [];
}

function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function matchesCurrentSite(item: AnnouncementItem, hostname: string) {
  const sites = normalizeSites(item.sites);

  if (!sites.length) {
    return false;
  }

  if (sites.includes(hostname)) {
    return true;
  }

  return isLocalHostname(hostname) && sites.includes("localhost");
}

function normalizeAnnouncements(
  payload: AnnouncementApiResponse,
  hostname: string,
): NormalizedAnnouncement[] {
  if (!Array.isArray(payload.announcements)) {
    return [];
  }

  return payload.announcements
    .filter((item) => matchesCurrentSite(item, hostname))
    .map((item, index) => {
      const title = typeof item.title === "string" ? item.title.trim() : "";
      const content = typeof item.content === "string" ? item.content.trim() : "";

      if (!title || !content) {
        return null;
      }

      return {
        id: item.id?.trim() || `announcement-${index}`,
        title,
        content,
      };
    })
    .filter((item): item is NormalizedAnnouncement => Boolean(item));
}

export function AnnouncementModal({ open, onClose }: AnnouncementModalProps) {
  const [announcements, setAnnouncements] = useState<NormalizedAnnouncement[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return;
    }

    let isCancelled = false;

    const loadAnnouncements = async () => {
      try {
        const response = await fetch(ANNOUNCEMENTS_ENDPOINT);

        if (!response.ok) {
          throw new Error(`Failed to fetch announcements: ${response.status}`);
        }

        const data = (await response.json()) as AnnouncementApiResponse;
        const hostname = window.location.hostname;
        const nextAnnouncements = normalizeAnnouncements(data, hostname);

        if (!isCancelled) {
          setAnnouncements(nextAnnouncements);
          setHasLoaded(true);
        }
      } catch {
        if (!isCancelled) {
          setAnnouncements([]);
          setHasLoaded(true);
        }
      }
    };

    void loadAnnouncements();

    return () => {
      isCancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setIsVisible(false);
      setIsClosing(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !hasLoaded || announcements.length === 0) {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [announcements.length, hasLoaded, open]);

  const handleClose = () => {
    if (isClosing) {
      return;
    }

    setIsClosing(true);

    window.setTimeout(() => {
      onClose();
    }, ANNOUNCEMENT_EXIT_DURATION_MS);
  };

  if (!open || !hasLoaded || announcements.length === 0) {
    return null;
  }

  return (
    <div
      className={`modal-backdrop announcement-backdrop ${isVisible && !isClosing ? "is-open" : "is-closed"}`}
      onClick={handleClose}
      role="presentation"
    >
      <section
        aria-labelledby="announcement-title"
        aria-modal="true"
        className={`announcement-modal ${isVisible && !isClosing ? "is-open" : "is-closed"}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="announcement-head">
          <div>
            <p className="announcement-kicker">Site Notice</p>
            <h2 id="announcement-title">站点公告</h2>
          </div>
          <button aria-label="关闭公告" className="close-button" onClick={handleClose} type="button">
            ×
          </button>
        </div>

        <div className="announcement-body">
          <div className="announcement-list">
            {announcements.map((announcement) => (
              <article className="announcement-item" key={announcement.id}>
                <h3>{announcement.title}</h3>
                <p>{announcement.content}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
