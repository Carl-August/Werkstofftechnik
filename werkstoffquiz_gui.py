import json
import os
import random # Import hier oben sammeln
import tkinter as tk
from tkinter import messagebox

QUESTIONS_FILE = "questions.json"
CATALOG_FILE = "answer_catalog.json"

DEFAULT_CATALOG = [
    "Polyethylen (PE)", "Polytetrafluorethylen (PTFE)", "Aluminiumoxid (Al2O3)",
    "Siliciumcarbid (SiC)", "Baustahl (S235JR)", "Messing (CuZn37)",
    "Titan Grad 5 (Ti-6Al-4V)", "Glasfaserverstärkter Kunststoff (GFK)",
    "Kohlenstofffaserverstärkter Kunststoff (CFK)", "Holz (Fichte)", "Beton C25/30",
    "Kupfer (Cu)", "Magnesium (Mg)", "Zink (Zn)", "Nickel (Ni)", "Chrom (Cr)",
    "Wolfram (W)", "Keramik", "Gummi", "Leder", "Stahl", "Gusseisen",
    "Bronze", "Aluminium", "Polypropylen (PP)", "Polyvinylchlorid (PVC)"
]

def load_questions():
    """Lädt Fragen aus der QUESTIONS_FILE JSON-Datei."""
    if not os.path.exists(QUESTIONS_FILE):
        return []
    try:
        with open(QUESTIONS_FILE, 'r', encoding='utf-8') as f:
            questions = json.load(f)
            # Validierung, ob es eine Liste von Dictionaries ist
            if not isinstance(questions, list):
                print(f"Warnung: {QUESTIONS_FILE} enthält keine Liste. Wird als leer behandelt.")
                return []
            for q in questions:
                if not isinstance(q, dict) or "question" not in q or "correctAnswer" not in q:
                    print(f"Warnung: Ungültiger Frageneintrag in {QUESTIONS_FILE} gefunden: {q}. Wird übersprungen.")
                    # Optional: remove invalid entry or handle differently
            return [q for q in questions if isinstance(q, dict) and "question" in q and "correctAnswer" in q]
    except json.JSONDecodeError:
        print(f"Fehler beim Dekodieren von JSON aus {QUESTIONS_FILE}. Datei ist möglicherweise korrupt.")
        return []
    except Exception as e:
        print(f"Ein unerwarteter Fehler ist beim Laden von {QUESTIONS_FILE} aufgetreten: {e}")
        return []

def save_questions(questions):
    """Speichert die Fragenliste in die QUESTIONS_FILE JSON-Datei."""
    try:
        with open(QUESTIONS_FILE, 'w', encoding='utf-8') as f:
            json.dump(questions, f, indent=4, ensure_ascii=False)
    except Exception as e:
        print(f"Fehler beim Speichern der Fragen in {QUESTIONS_FILE}: {e}")

def load_answer_catalog():
    """Lädt den Antwortkatalog aus der CATALOG_FILE JSON-Datei.
    Initialisiert mit DEFAULT_CATALOG, wenn die Datei nicht existiert oder leer ist."""
    if not os.path.exists(CATALOG_FILE):
        save_answer_catalog(DEFAULT_CATALOG) # Speichert den Default Katalog, wenn Datei nicht existiert
        return DEFAULT_CATALOG
    try:
        with open(CATALOG_FILE, 'r', encoding='utf-8') as f:
            catalog = json.load(f)
            if not isinstance(catalog, list): # Einfache Validierung
                print(f"Warnung: {CATALOG_FILE} enthält keine Liste. Initialisiere mit Default-Katalog.")
                save_answer_catalog(DEFAULT_CATALOG)
                return DEFAULT_CATALOG
            if not catalog: # Wenn Katalog leer ist
                print(f"Hinweis: {CATALOG_FILE} ist leer. Initialisiere mit Default-Katalog.")
                save_answer_catalog(DEFAULT_CATALOG)
                return DEFAULT_CATALOG
            # Sicherstellen, dass alle Elemente Strings sind
            if not all(isinstance(item, str) for item in catalog):
                print(f"Warnung: {CATALOG_FILE} enthält nicht nur Strings. Filtere ungültige Einträge.")
                catalog = [item for item in catalog if isinstance(item, str)]
                if not catalog: # Wenn nach Filterung leer
                    save_answer_catalog(DEFAULT_CATALOG)
                    return DEFAULT_CATALOG
            return catalog
    except json.JSONDecodeError:
        print(f"Fehler beim Dekodieren von JSON aus {CATALOG_FILE}. Initialisiere mit Default.")
        save_answer_catalog(DEFAULT_CATALOG)
        return DEFAULT_CATALOG
    except Exception as e:
        print(f"Ein unerwarteter Fehler ist beim Laden von {CATALOG_FILE} aufgetreten: {e}. Initialisiere mit Default.")
        save_answer_catalog(DEFAULT_CATALOG)
        return DEFAULT_CATALOG

def save_answer_catalog(catalog):
    """Speichert die Katalogliste in die CATALOG_FILE JSON-Datei."""
    try:
        with open(CATALOG_FILE, 'w', encoding='utf-8') as f:
            json.dump(catalog, f, indent=4, ensure_ascii=False)
    except Exception as e:
        print(f"Fehler beim Speichern des Antwortkatalogs in {CATALOG_FILE}: {e}")

class WerkstoffquizApp:
    def __init__(self, root_tk):
        self.root = root_tk
        self.root.title("Werkstoffquiz")
        self.root.geometry("600x450") # Startgröße

        # Daten laden
        self.questions = load_questions()
        self.answer_catalog = load_answer_catalog()
        print(f"App gestartet: {len(self.questions)} Fragen, {len(self.answer_catalog)} Katalogeinträge geladen.")

        # --- UI Elemente ---
        # Frame für Frage
        self.question_frame = tk.Frame(self.root, pady=10)
        self.question_frame.pack(fill="x")
        self.question_label = tk.Label(self.question_frame, text="Frage wird hier angezeigt...", font=("Arial", 14), wraplength=550)
        self.question_label.pack()

        # Frame für Antwort-Buttons
        self.answer_buttons_frame = tk.Frame(self.root, pady=10)
        self.answer_buttons_frame.pack()
        
        self.answer_buttons = []
        self.button_frames = []
        for i in range(3):
            btn_frame = tk.Frame(self.answer_buttons_frame)
            btn_frame.pack(fill="x", pady=3, padx=30)  # Padding für optische Zentrierung
            button = tk.Button(
                btn_frame,
                text=f"Antwort {i+1}",
                font=("Arial", 12),
                anchor="center",
                justify="center",
                wraplength=1  # Wird später dynamisch gesetzt
            )
            button.pack(fill="x", expand=True)
            self.answer_buttons.append(button)
            self.button_frames.append(btn_frame)

        # Fenster-Resize-Event binden, um wraplength der Buttons dynamisch zu setzen
        self.root.bind("<Configure>", self._update_button_wraplength)

    def _update_button_wraplength(self, event=None):
        # Setzt wraplength der Buttons auf die aktuelle Breite des answer_buttons_frame (abzgl. Padding)
        frame_width = self.answer_buttons_frame.winfo_width()
        wrap = max(200, frame_width - 60)  # 60px Padding (2x30)
        for btn in self.answer_buttons:
            btn.config(wraplength=wrap)


        # Frame für Feedback und Nächste Frage Button
        self.feedback_next_frame = tk.Frame(self.root, pady=10)
        self.feedback_next_frame.pack()

        self.feedback_label = tk.Label(self.feedback_next_frame, text="", font=("Arial", 12, "bold"), width=30)
        self.feedback_label.pack(pady=5)

        self.next_question_button = tk.Button(self.feedback_next_frame, text="Nächste Frage", font=("Arial", 12))
        self.next_question_button.pack(pady=5)
        # self.next_question_button.config(state=tk.DISABLED) # Initial deaktiviert

        # --- Menü ---
        menubar = tk.Menu(self.root)
        
        filemenu = tk.Menu(menubar, tearoff=0)
        filemenu.add_command(label="Beenden", command=self.root.quit)
        menubar.add_cascade(label="Datei", menu=filemenu)
        
        managementmenu = tk.Menu(menubar, tearoff=0)
        managementmenu.add_command(label="Frage hinzufügen...", command=self.open_add_question_dialog) 
        managementmenu.add_command(label="Antwortkatalog verwalten...", command=self.open_manage_catalog_dialog)
        menubar.add_cascade(label="Verwaltung", menu=managementmenu)
        
        self.root.config(menu=menubar)

        # Initial eine Frage anzeigen
        if not self.questions:
            self.question_label.config(text="Keine Fragen vorhanden. Bitte fügen Sie Fragen über das Menü 'Verwaltung' hinzu.")
            for btn in self.answer_buttons:
                btn.config(state=tk.DISABLED)
            self.next_question_button.config(state=tk.DISABLED)
        elif len(self.answer_catalog) < 2: # Mindestens 2 Distraktoren benötigt
             self.question_label.config(text="Antwortkatalog enthält nicht genügend Einträge. Bitte über 'Verwaltung' ergänzen.")
             for btn in self.answer_buttons:
                btn.config(state=tk.DISABLED)
             self.next_question_button.config(state=tk.DISABLED)
        else:
            self.display_question() 

    def open_add_question_dialog(self):
        dialog = AddQuestionDialog(self.root, self.questions, self.answer_catalog, self.save_all_data)
        # Optional: Deaktivieren des Hauptfensters, während Dialog offen ist
        # self.root.wait_window(dialog.top) 
        # Nach Schließen des Dialogs ggf. UI aktualisieren, falls erste Frage hinzugefügt wurde
        if not self.questions or len(self.questions) == 1 and dialog.question_added : # Wenn vorher keine Fragen da waren oder nur eine hinzugefügt wurde
             self.display_question()

    def open_manage_catalog_dialog(self):
        dialog = ManageCatalogDialog(self.root, self.answer_catalog, self.save_all_data)
        # self.root.wait_window(dialog.top) # Optional modal
        # Nach Schließen des Dialogs ggf. UI aktualisieren, falls Katalog relevant war
        self.display_question() # Einfachste Lösung: Frage neu laden, falls Katalog geändert wurde


    def save_all_data(self):
        """Speichert sowohl Fragen als auch den Katalog."""
        save_questions(self.questions)
        save_answer_catalog(self.answer_catalog)
        print("Daten gespeichert.")

    def display_question(self):
        """Zeigt eine neue zufällige Frage und Antwortmöglichkeiten an."""
        # Reset der Button-Farben
        for btn in self.answer_buttons:
            btn.config(bg=self.root.cget('bg'), activebackground=self.root.cget('bg')) # Standardhintergrundfarbe

        if not self.questions:
            self.question_label.config(text="Keine Fragen vorhanden. Bitte fügen Sie Fragen hinzu.")
            for btn in self.answer_buttons:
                btn.config(state=tk.DISABLED, text="-")
            self.next_question_button.config(state=tk.DISABLED)
            self.feedback_label.config(text="")
            return

        if len(self.answer_catalog) < 2:
            self.question_label.config(text="Antwortkatalog hat zu wenige Einträge (<2). Bitte ergänzen.")
            for btn in self.answer_buttons:
                btn.config(state=tk.DISABLED, text="-")
            self.next_question_button.config(state=tk.DISABLED)
            self.feedback_label.config(text="")
            return

        current_question_data = random.choice(self.questions)
        self.current_correct_answer_text = current_question_data["correctAnswer"]
        self.question_label.config(text=current_question_data["question"])

        possible_distractors = [ans for ans in self.answer_catalog if ans.lower() != self.current_correct_answer_text.lower()]
        
        if len(possible_distractors) < 2:
            self.question_label.config(text=f"Nicht genug Distraktoren für Frage: '{current_question_data['question']}'. Katalog erweitern.")
            for btn in self.answer_buttons:
                btn.config(state=tk.DISABLED, text="-")
            self.next_question_button.config(state=tk.DISABLED)
            self.feedback_label.config(text="")
            return

        random.shuffle(possible_distractors)
        chosen_distractors = possible_distractors[:2]

        answer_options = chosen_distractors + [self.current_correct_answer_text]
        random.shuffle(answer_options)

        for i, btn in enumerate(self.answer_buttons):
            btn.config(
                text=answer_options[i],
                state=tk.NORMAL,
                anchor="center",
                justify="center",
                command=lambda answer=answer_options[i], button_ref=btn: self.check_answer(answer, button_ref)
            )
        self._update_button_wraplength()
        self.feedback_label.config(text="")
        self.next_question_button.config(state=tk.DISABLED, command=self.display_question)


    def check_answer(self, selected_answer_text, selected_button):
        """Überprüft die ausgewählte Antwort und gibt Feedback."""
        is_correct = (selected_answer_text == self.current_correct_answer_text)

        for btn in self.answer_buttons:
            btn.config(state=tk.DISABLED) # Alle Antwortbuttons deaktivieren
            if btn.cget("text") == self.current_correct_answer_text:
                btn.config(bg="lightgreen", activebackground="lightgreen")
            elif btn == selected_button and not is_correct: # Falsch ausgewählter Button
                btn.config(bg="salmon", activebackground="salmon")
            else: # Nicht ausgewählte falsche Antworten
                btn.config(bg=self.root.cget('bg'), activebackground=self.root.cget('bg'))


        if is_correct:
            self.feedback_label.config(text="Richtig!", fg="green")
            selected_button.config(bg="lightgreen", activebackground="lightgreen")
        else:
            self.feedback_label.config(text=f"Falsch! Richtig wäre: {self.current_correct_answer_text}", fg="red")
            selected_button.config(bg="salmon", activebackground="salmon")
        
        self.next_question_button.config(state=tk.NORMAL)


class AddQuestionDialog:
    def __init__(self, parent, questions_list, catalog_list, save_callback):
        self.parent = parent
        self.questions = questions_list
        self.catalog = catalog_list
        self.save_callback = save_callback
        self.question_added = False

        self.top = tk.Toplevel(parent)
        self.top.title("Neue Frage hinzufügen")
        self.top.geometry("400x200")
        self.top.transient(parent)
        self.top.grab_set()

        tk.Label(self.top, text="Frage:", font=("Arial", 12)).pack(pady=(10,0))
        self.question_entry = tk.Entry(self.top, width=50, font=("Arial", 10))
        self.question_entry.pack(pady=5, padx=10)

        tk.Label(self.top, text="Korrekte Antwort:", font=("Arial", 12)).pack(pady=(10,0))
        self.answer_entry = tk.Entry(self.top, width=50, font=("Arial", 10))
        self.answer_entry.pack(pady=5, padx=10)

        button_frame = tk.Frame(self.top)
        button_frame.pack(pady=10)

        save_button = tk.Button(button_frame, text="Speichern", command=self.save_question, font=("Arial", 10))
        save_button.pack(side=tk.LEFT, padx=5)
        cancel_button = tk.Button(button_frame, text="Abbrechen", command=self.top.destroy, font=("Arial", 10))
        cancel_button.pack(side=tk.LEFT, padx=5)
        
        self.question_entry.focus_set()

    def save_question(self):
        question_text = self.question_entry.get().strip()
        correct_answer_text = self.answer_entry.get().strip()

        if not question_text or not correct_answer_text:
            messagebox.showerror("Fehler", "Frage und korrekte Antwort dürfen nicht leer sein.", parent=self.top)
            return

        self.questions.append({"question": question_text, "correctAnswer": correct_answer_text})
        
        found_in_catalog = False
        for item in self.catalog:
            if item.lower() == correct_answer_text.lower():
                found_in_catalog = True
                break
        if not found_in_catalog:
            self.catalog.append(correct_answer_text)
            print(f"'{correct_answer_text}' zum Katalog hinzugefügt.")

        self.save_callback()
        self.question_added = True 
        messagebox.showinfo("Erfolg", "Frage erfolgreich gespeichert.", parent=self.top)
        self.top.destroy()


class ManageCatalogDialog:
    def __init__(self, parent, catalog_list, save_callback):
        self.parent = parent
        self.catalog = catalog_list
        self.save_callback = save_callback

        self.top = tk.Toplevel(parent)
        self.top.title("Antwortkatalog verwalten")
        self.top.geometry("450x400")
        self.top.transient(parent)
        self.top.grab_set()

        input_frame = tk.Frame(self.top)
        input_frame.pack(pady=10, padx=10, fill=tk.X)
        
        tk.Label(input_frame, text="Neue Antwort:", font=("Arial", 10)).pack(side=tk.LEFT)
        self.catalog_entry = tk.Entry(input_frame, width=30, font=("Arial", 10))
        self.catalog_entry.pack(side=tk.LEFT, padx=5, expand=True, fill=tk.X)
        add_button = tk.Button(input_frame, text="Hinzufügen", command=self.add_to_catalog, font=("Arial", 10))
        add_button.pack(side=tk.LEFT, padx=5)

        list_frame = tk.Frame(self.top)
        list_frame.pack(pady=5, padx=10, expand=True, fill=tk.BOTH)

        self.scrollbar = tk.Scrollbar(list_frame, orient=tk.VERTICAL)
        self.catalog_listbox = tk.Listbox(list_frame, yscrollcommand=self.scrollbar.set, font=("Arial", 10), height=10)
        self.scrollbar.config(command=self.catalog_listbox.yview)
        
        self.scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.catalog_listbox.pack(side=tk.LEFT, expand=True, fill=tk.BOTH)

        self.populate_listbox()

        close_button = tk.Button(self.top, text="Schließen", command=self.top.destroy, font=("Arial", 10))
        close_button.pack(pady=10)

        self.catalog_entry.focus_set()

    def populate_listbox(self):
        self.catalog_listbox.delete(0, tk.END)
        for item in sorted(self.catalog, key=str.lower):
            self.catalog_listbox.insert(tk.END, item)

    def add_to_catalog(self):
        new_answer = self.catalog_entry.get().strip()
        if not new_answer:
            messagebox.showerror("Fehler", "Antwort darf nicht leer sein.", parent=self.top)
            return

        is_duplicate = False
        for item in self.catalog:
            if item.lower() == new_answer.lower():
                is_duplicate = True
                break
        
        if is_duplicate:
            messagebox.showwarning("Warnung", "Diese Antwort ist bereits im Katalog vorhanden.", parent=self.top)
            return

        self.catalog.append(new_answer)
        self.save_callback()
        self.populate_listbox()
        self.catalog_entry.delete(0, tk.END)
        messagebox.showinfo("Erfolg", f"'{new_answer}' zum Katalog hinzugefügt.", parent=self.top)

if __name__ == '__main__':
    print("Teste Lade-/Speicherfunktionen...")
    current_questions = load_questions()
    print(f"Geladene Fragen: {len(current_questions)}")
    current_catalog = load_answer_catalog()
    print(f"Geladener Katalog: {len(current_catalog)} Einträge. Beispiel: {current_catalog[:3]}")
    
    print("\n--- Werkstoffquiz GUI wird hier starten ---")
    root = tk.Tk()
    app = WerkstoffquizApp(root)
    root.mainloop()
