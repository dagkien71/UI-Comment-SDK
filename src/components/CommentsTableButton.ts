export interface CommentsTableButtonProps {
  onClick: () => void;
  theme: "light" | "dark";
  commentsCount: number;
  isVisible?: boolean;
}

export class CommentsTableButton {
  private props: CommentsTableButtonProps;
  private element: HTMLElement;

  constructor(props: CommentsTableButtonProps) {
    this.props = props;
    this.element = this.createElement();
    this.attachEventListeners();
  }

  private createElement(): HTMLElement {
    const button = document.createElement("button");
    button.className = `uicm-comments-table-btn uicm-comments-table-btn--${this.props.theme}`;
    button.setAttribute("aria-label", "Open Comments Table");
    button.title = "View All Comments in Table";
    if (this.props.isVisible !== true) {
      button.style.display = "none";
      button.style.opacity = "0";
      button.style.transform = "scale(0.8) translateY(20px)";
    }
    this.updateButtonContent(button);
    return button;
  }

  private updateButtonContent(buttonElement: HTMLElement): void {
    buttonElement.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
  }

  private updateContent(): void {
    if (this.element) {
      this.updateButtonContent(this.element);
    }
  }

  private attachEventListeners(): void {
    this.element.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.props.onClick();
    });
  }

  public updateCommentsCount(count: number): void {
    this.props.commentsCount = count;
    this.updateContent();
  }

  public updateTheme(theme: "light" | "dark"): void {
    this.element.className = this.element.className.replace(
      /uicm-comments-table-btn--(light|dark)/,
      `uicm-comments-table-btn--${theme}`
    );
    this.props.theme = theme;
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public destroy(): void {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }

  public setVisible(visible: boolean): void {
    if (visible) {
      this.element.style.display = "flex";
      setTimeout(() => {
        this.element.style.opacity = "1";
        this.element.style.transform = "scale(1) translateY(0)";
      }, 10);
    } else {
      this.element.style.opacity = "0";
      this.element.style.transform = "scale(0.8) translateY(20px)";
      setTimeout(() => {
        this.element.style.display = "none";
      }, 300);
    }
  }
}
