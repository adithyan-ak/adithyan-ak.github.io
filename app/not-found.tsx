import Link from "next/link";
import styles from "./dossier.module.css";

export default function NotFound() {
  return (
    <div className={`${styles.scene} ${styles.notFoundScene}`}>
      <main className={styles.frame}>
        <article className={`${styles.paper} ${styles.notFoundPaper}`}>
          <div className={styles.folderTab}>Unfiled record / 404</div>
          <div className={styles.errorFile}>
            <p className={styles.kicker}>Record not found</p>
            <h1>This file does not exist.</h1>
            <p>
              The requested path is absent from the public research archive.
            </p>
            <Link className={styles.errorLink} href="/">
              Return to dossier →
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
