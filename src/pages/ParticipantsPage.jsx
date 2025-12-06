"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useProject } from "@/contexts/ProjectContext"
import { useParticipants } from "@/hooks/use-participants"
import {
  Search,
  MoreVertical,
  Plus,
  FileText,
  Edit,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Minus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

// Mock data - Polish participants with expanded fields
const initialParticipants = [
  {
    id: 1,
    firstName: "Leszek",
    lastName: "Szarkowicz",
    email: "leszek.szarkowicz@example.pl",
    konwencja: true,
    chor: true,
    seminarium: false,
    day6: true,
    day7: true,
    day8: true,
    day9: true,
    day10: true,
    day11: false,
    night6_7: true,
    night7_8: true,
    night8_9: true,
    night9_10: true,
    night10_11: true,
    night11_12: false,
    rodzajNoclegu: "Pokój 2-osobowy",
    wspolLokatorzy: "Stanisław Sławiński",
    rezygnacjaNoclegu: false,
    przypisanyPokoj: "A-101",
    pelnyPakiet: true,
    obiadKolacja: false,
    tylkoObiad: false,
    dietaWegetarianska: false,
    innaDieta: "",
    ulatwionytDostep: false,
    dodatkowyObiad11: false,
    dodatkowaKolacja11: false,
    transportZBalic: true,
    transportNaBalice: true,
    wylot: "15:30",
    kopertaPdf: true,
    identyfikatorPdf: true,
    skompletowanoKoperte: true,
    wydanoKoperte: true,
    wydanoKlucze: true,
    statusRezygnacji: false,
    paymentStatus: "Opłacone",
    documentStatus: "Gotowy",
  },
  {
    id: 2,
    firstName: "Dorota",
    lastName: "Szarkowicz",
    email: "dorota.szarkowicz@example.pl",
    konwencja: true,
    chor: false,
    seminarium: true,
    day6: true,
    day7: true,
    day8: false,
    day9: true,
    day10: true,
    day11: true,
    night6_7: true,
    night7_8: true,
    night8_9: false,
    night9_10: true,
    night10_11: true,
    night11_12: true,
    rodzajNoclegu: "Pokój 2-osobowy",
    wspolLokatorzy: "Miriam Szarkowicz",
    rezygnacjaNoclegu: false,
    przypisanyPokoj: "A-102",
    pelnyPakiet: true,
    obiadKolacja: false,
    tylkoObiad: false,
    dietaWegetarianska: true,
    innaDieta: "",
    ulatwionytDostep: false,
    dodatkowyObiad11: true,
    dodatkowaKolacja11: true,
    transportZBalic: false,
    transportNaBalice: true,
    wylot: "18:45",
    kopertaPdf: true,
    identyfikatorPdf: true,
    skompletowanoKoperte: true,
    wydanoKoperte: false,
    wydanoKlucze: false,
    statusRezygnacji: false,
    paymentStatus: "Nieopłacone",
    documentStatus: "-",
  },
  {
    id: 3,
    firstName: "Stanisław",
    lastName: "Sławiński",
    email: "stanley.slawinski@example.pl",
    konwencja: true,
    chor: true,
    seminarium: true,
    day6: true,
    day7: true,
    day8: true,
    day9: true,
    day10: true,
    day11: true,
    night6_7: true,
    night7_8: true,
    night8_9: true,
    night9_10: true,
    night10_11: true,
    night11_12: true,
    rodzajNoclegu: "Pokój 2-osobowy",
    wspolLokatorzy: "Leszek Szarkowicz",
    rezygnacjaNoclegu: false,
    przypisanyPokoj: "A-101",
    pelnyPakiet: true,
    obiadKolacja: false,
    tylkoObiad: false,
    dietaWegetarianska: false,
    innaDieta: "Bez glutenu",
    ulatwionytDostep: false,
    dodatkowyObiad11: false,
    dodatkowaKolacja11: false,
    transportZBalic: true,
    transportNaBalice: true,
    wylot: "15:30",
    kopertaPdf: true,
    identyfikatorPdf: true,
    skompletowanoKoperte: true,
    wydanoKoperte: true,
    wydanoKlucze: true,
    statusRezygnacji: false,
    paymentStatus: "Opłacone",
    documentStatus: "Gotowy",
  },
  {
    id: 4,
    firstName: "Sławomir",
    lastName: "Stasziński",
    email: "slawomir.staszinski@example.pl",
    konwencja: false,
    chor: true,
    seminarium: false,
    day6: false,
    day7: true,
    day8: true,
    day9: true,
    day10: false,
    day11: false,
    night6_7: false,
    night7_8: true,
    night8_9: true,
    night9_10: false,
    night10_11: false,
    night11_12: false,
    rodzajNoclegu: "Pokój 4-osobowy",
    wspolLokatorzy: "Krzysztof Nawrot, Mati Zabój, Daniel Szarkowicz",
    rezygnacjaNoclegu: false,
    przypisanyPokoj: "B-205",
    pelnyPakiet: false,
    obiadKolacja: true,
    tylkoObiad: false,
    dietaWegetarianska: false,
    innaDieta: "",
    ulatwionytDostep: false,
    dodatkowyObiad11: false,
    dodatkowaKolacja11: false,
    transportZBalic: false,
    transportNaBalice: false,
    wylot: "",
    kopertaPdf: false,
    identyfikatorPdf: false,
    skompletowanoKoperte: false,
    wydanoKoperte: false,
    wydanoKlucze: false,
    statusRezygnacji: false,
    paymentStatus: "Oczekuje",
    documentStatus: "-",
  },
  {
    id: 5,
    firstName: "Krzysztof",
    lastName: "Nawrot",
    email: "krzysztof.nawrot@example.pl",
    konwencja: true,
    chor: false,
    seminarium: true,
    day6: true,
    day7: true,
    day8: true,
    day9: true,
    day10: true,
    day11: false,
    night6_7: true,
    night7_8: true,
    night8_9: true,
    night9_10: true,
    night10_11: false,
    night11_12: false,
    rodzajNoclegu: "Pokój 4-osobowy",
    wspolLokatorzy: "Sławomir Stasziński, Mati Zabój, Daniel Szarkowicz",
    rezygnacjaNoclegu: false,
    przypisanyPokoj: "B-205",
    pelnyPakiet: true,
    obiadKolacja: false,
    tylkoObiad: false,
    dietaWegetarianska: true,
    innaDieta: "",
    ulatwionytDostep: false,
    dodatkowyObiad11: false,
    dodatkowaKolacja11: false,
    transportZBalic: true,
    transportNaBalice: false,
    wylot: "",
    kopertaPdf: true,
    identyfikatorPdf: true,
    skompletowanoKoperte: true,
    wydanoKoperte: true,
    wydanoKlucze: true,
    statusRezygnacji: false,
    paymentStatus: "Opłacone",
    documentStatus: "Gotowy",
  },
  {
    id: 6,
    firstName: "Mati",
    lastName: "Zabój",
    email: "matthew.zaboj@example.pl",
    konwencja: true,
    chor: false,
    seminarium: false,
    day6: true,
    day7: false,
    day8: true,
    day9: true,
    day10: true,
    day11: true,
    night6_7: false,
    night7_8: false,
    night8_9: true,
    night9_10: true,
    night10_11: true,
    night11_12: true,
    rodzajNoclegu: "Pokój 4-osobowy",
    wspolLokatorzy: "Sławomir Stasziński, Krzysztof Nawrot, Daniel Szarkowicz",
    rezygnacjaNoclegu: false,
    przypisanyPokoj: "B-205",
    pelnyPakiet: false,
    obiadKolacja: false,
    tylkoObiad: true,
    dietaWegetarianska: false,
    innaDieta: "Alergia na orzechy",
    ulatwionytDostep: false,
    dodatkowyObiad11: true,
    dodatkowaKolacja11: false,
    transportZBalic: false,
    transportNaBalice: true,
    wylot: "20:00",
    kopertaPdf: false,
    identyfikatorPdf: false,
    skompletowanoKoperte: false,
    wydanoKoperte: false,
    wydanoKlucze: false,
    statusRezygnacji: false,
    paymentStatus: "Nieopłacone",
    documentStatus: "-",
  },
  {
    id: 7,
    firstName: "Miriam",
    lastName: "Szarkowicz",
    email: "miriam.sz@example.pl",
    konwencja: true,
    chor: true,
    seminarium: true,
    day6: true,
    day7: true,
    day8: true,
    day9: true,
    day10: true,
    day11: true,
    night6_7: true,
    night7_8: true,
    night8_9: true,
    night9_10: true,
    night10_11: true,
    night11_12: true,
    rodzajNoclegu: "Pokój 2-osobowy",
    wspolLokatorzy: "Dorota Szarkowicz",
    rezygnacjaNoclegu: false,
    przypisanyPokoj: "A-102",
    pelnyPakiet: true,
    obiadKolacja: false,
    tylkoObiad: false,
    dietaWegetarianska: false,
    innaDieta: "",
    ulatwionytDostep: false,
    dodatkowyObiad11: true,
    dodatkowaKolacja11: true,
    transportZBalic: true,
    transportNaBalice: true,
    wylot: "18:45",
    kopertaPdf: true,
    identyfikatorPdf: true,
    skompletowanoKoperte: true,
    wydanoKoperte: true,
    wydanoKlucze: true,
    statusRezygnacji: false,
    paymentStatus: "Opłacone",
    documentStatus: "Gotowy",
  },
  {
    id: 8,
    firstName: "Kesja",
    lastName: "Szarkowicz",
    email: "kellie.szarkowicz@example.pl",
    konwencja: false,
    chor: false,
    seminarium: true,
    day6: false,
    day7: true,
    day8: true,
    day9: false,
    day10: false,
    day11: false,
    night6_7: false,
    night7_8: true,
    night8_9: false,
    night9_10: false,
    night10_11: false,
    night11_12: false,
    rodzajNoclegu: "Pokój 1-osobowy",
    wspolLokatorzy: "",
    rezygnacjaNoclegu: false,
    przypisanyPokoj: "C-301",
    pelnyPakiet: false,
    obiadKolacja: true,
    tylkoObiad: false,
    dietaWegetarianska: true,
    innaDieta: "",
    ulatwionytDostep: false,
    dodatkowyObiad11: false,
    dodatkowaKolacja11: false,
    transportZBalic: false,
    transportNaBalice: false,
    wylot: "",
    kopertaPdf: false,
    identyfikatorPdf: false,
    skompletowanoKoperte: false,
    wydanoKoperte: false,
    wydanoKlucze: false,
    statusRezygnacji: false,
    paymentStatus: "Oczekuje",
    documentStatus: "-",
  },
  {
    id: 9,
    firstName: "Daniel",
    lastName: "Szarkowicz",
    email: "danek.szarkowicz@example.pl",
    konwencja: true,
    chor: true,
    seminarium: false,
    day6: true,
    day7: true,
    day8: true,
    day9: true,
    day10: true,
    day11: false,
    night6_7: true,
    night7_8: true,
    night8_9: true,
    night9_10: true,
    night10_11: false,
    night11_12: false,
    rodzajNoclegu: "Pokój 4-osobowy",
    wspolLokatorzy: "Sławomir Stasziński, Krzysztof Nawrot, Mati Zabój",
    rezygnacjaNoclegu: false,
    przypisanyPokoj: "B-205",
    pelnyPakiet: true,
    obiadKolacja: false,
    tylkoObiad: false,
    dietaWegetarianska: false,
    innaDieta: "",
    ulatwionytDostep: false,
    dodatkowyObiad11: false,
    dodatkowaKolacja11: false,
    transportZBalic: true,
    transportNaBalice: true,
    wylot: "15:30",
    kopertaPdf: true,
    identyfikatorPdf: true,
    skompletowanoKoperte: true,
    wydanoKoperte: true,
    wydanoKlucze: true,
    statusRezygnacji: false,
    paymentStatus: "Opłacone",
    documentStatus: "Gotowy",
  },
  {
    id: 10,
    firstName: "Franciszek",
    lastName: "Olejarz",
    email: "francesco@example.pl",
    konwencja: false,
    chor: true,
    seminarium: false,
    day6: false,
    day7: true,
    day8: true,
    day9: true,
    day10: false,
    day11: false,
    night6_7: false,
    night7_8: true,
    night8_9: true,
    night9_10: false,
    night10_11: false,
    night11_12: false,
    rodzajNoclegu: "",
    wspolLokatorzy: "",
    rezygnacjaNoclegu: true,
    przypisanyPokoj: "",
    pelnyPakiet: false,
    obiadKolacja: false,
    tylkoObiad: true,
    dietaWegetarianska: false,
    innaDieta: "",
    ulatwionytDostep: false,
    dodatkowyObiad11: false,
    dodatkowaKolacja11: false,
    transportZBalic: false,
    transportNaBalice: false,
    wylot: "",
    kopertaPdf: false,
    identyfikatorPdf: false,
    skompletowanoKoperte: false,
    wydanoKoperte: false,
    wydanoKlucze: false,
    statusRezygnacji: false,
    paymentStatus: "Nieopłacone",
    documentStatus: "-",
  },
  {
    id: 11,
    firstName: "Wojciech",
    lastName: "Kowalczyk",
    email: "wojciech.kowalczyk@example.pl",
    konwencja: true,
    chor: false,
    seminarium: true,
    day6: true,
    day7: true,
    day8: true,
    day9: true,
    day10: true,
    day11: true,
    night6_7: true,
    night7_8: true,
    night8_9: true,
    night9_10: true,
    night10_11: true,
    night11_12: true,
    rodzajNoclegu: "Pokój 1-osobowy",
    wspolLokatorzy: "",
    rezygnacjaNoclegu: false,
    przypisanyPokoj: "C-302",
    pelnyPakiet: true,
    obiadKolacja: false,
    tylkoObiad: false,
    dietaWegetarianska: false,
    innaDieta: "Bezlaktozowa",
    ulatwionytDostep: true,
    dodatkowyObiad11: true,
    dodatkowaKolacja11: true,
    transportZBalic: true,
    transportNaBalice: true,
    wylot: "12:00",
    kopertaPdf: true,
    identyfikatorPdf: true,
    skompletowanoKoperte: true,
    wydanoKoperte: false,
    wydanoKlucze: false,
    statusRezygnacji: false,
    paymentStatus: "Opłacone",
    documentStatus: "Gotowy",
  },
  {
    id: 12,
    firstName: "Agnieszka",
    lastName: "Wiśniewska",
    email: "agnieszka.wisniewska@example.pl",
    konwencja: true,
    chor: true,
    seminarium: false,
    day6: true,
    day7: true,
    day8: false,
    day9: false,
    day10: false,
    day11: false,
    night6_7: true,
    night7_8: false,
    night8_9: false,
    night9_10: false,
    night10_11: false,
    night11_12: false,
    rodzajNoclegu: "",
    wspolLokatorzy: "",
    rezygnacjaNoclegu: true,
    przypisanyPokoj: "",
    pelnyPakiet: false,
    obiadKolacja: false,
    tylkoObiad: false,
    dietaWegetarianska: false,
    innaDieta: "",
    ulatwionytDostep: false,
    dodatkowyObiad11: false,
    dodatkowaKolacja11: false,
    transportZBalic: false,
    transportNaBalice: false,
    wylot: "",
    kopertaPdf: false,
    identyfikatorPdf: false,
    skompletowanoKoperte: false,
    wydanoKoperte: false,
    wydanoKlucze: false,
    statusRezygnacji: false,
    paymentStatus: "Nieopłacone",
    documentStatus: "-",
  },
  {
    id: 13,
    firstName: "Tomasz",
    lastName: "Nowicki",
    email: "tomasz.nowicki@example.pl",
    konwencja: true,
    chor: true,
    seminarium: true,
    day6: true,
    day7: true,
    day8: true,
    day9: true,
    day10: true,
    day11: true,
    night6_7: true,
    night7_8: true,
    night8_9: true,
    night9_10: true,
    night10_11: true,
    night11_12: true,
    rodzajNoclegu: "Pokój 2-osobowy",
    wspolLokatorzy: "Piotr Zieliński",
    rezygnacjaNoclegu: false,
    przypisanyPokoj: "D-401",
    pelnyPakiet: true,
    obiadKolacja: false,
    tylkoObiad: false,
    dietaWegetarianska: false,
    innaDieta: "",
    ulatwionytDostep: false,
    dodatkowyObiad11: true,
    dodatkowaKolacja11: true,
    transportZBalic: true,
    transportNaBalice: true,
    wylot: "14:00",
    kopertaPdf: true,
    identyfikatorPdf: true,
    skompletowanoKoperte: true,
    wydanoKoperte: true,
    wydanoKlucze: true,
    statusRezygnacji: false,
    paymentStatus: "Opłacone",
    documentStatus: "Gotowy",
  },
  {
    id: 14,
    firstName: "Piotr",
    lastName: "Zieliński",
    email: "piotr.zielinski@example.pl",
    konwencja: true,
    chor: false,
    seminarium: true,
    day6: true,
    day7: true,
    day8: true,
    day9: true,
    day10: true,
    day11: true,
    night6_7: true,
    night7_8: true,
    night8_9: true,
    night9_10: true,
    night10_11: true,
    night11_12: true,
    rodzajNoclegu: "Pokój 2-osobowy",
    wspolLokatorzy: "Tomasz Nowicki",
    rezygnacjaNoclegu: false,
    przypisanyPokoj: "D-401",
    pelnyPakiet: true,
    obiadKolacja: false,
    tylkoObiad: false,
    dietaWegetarianska: true,
    innaDieta: "",
    ulatwionytDostep: false,
    dodatkowyObiad11: false,
    dodatkowaKolacja11: false,
    transportZBalic: false,
    transportNaBalice: true,
    wylot: "16:30",
    kopertaPdf: true,
    identyfikatorPdf: true,
    skompletowanoKoperte: true,
    wydanoKoperte: false,
    wydanoKlucze: false,
    statusRezygnacji: false,
    paymentStatus: "Opłacone",
    documentStatus: "Gotowy",
  },
  {
    id: 15,
    firstName: "Maria",
    lastName: "Kamińska",
    email: "maria.kaminska@example.pl",
    konwencja: true,
    chor: true,
    seminarium: false,
    day6: true,
    day7: true,
    day8: true,
    day9: false,
    day10: true,
    day11: true,
    night6_7: true,
    night7_8: true,
    night8_9: false,
    night9_10: false,
    night10_11: true,
    night11_12: true,
    rodzajNoclegu: "Pokój 1-osobowy",
    wspolLokatorzy: "",
    rezygnacjaNoclegu: false,
    przypisanyPokoj: "C-303",
    pelnyPakiet: true,
    obiadKolacja: false,
    tylkoObiad: false,
    dietaWegetarianska: false,
    innaDieta: "Bez laktozy",
    ulatwionytDostep: false,
    dodatkowyObiad11: true,
    dodatkowaKolacja11: false,
    transportZBalic: true,
    transportNaBalice: true,
    wylot: "19:00",
    kopertaPdf: true,
    identyfikatorPdf: true,
    skompletowanoKoperte: true,
    wydanoKoperte: true,
    wydanoKlucze: true,
    statusRezygnacji: false,
    paymentStatus: "Opłacone",
    documentStatus: "Gotowy",
  },
  {
    id: 16,
    firstName: "Andrzej",
    lastName: "Lewandowski",
    email: "andrzej.lewandowski@example.pl",
    konwencja: false,
    chor: true,
    seminarium: true,
    day6: false,
    day7: true,
    day8: true,
    day9: true,
    day10: true,
    day11: false,
    night6_7: false,
    night7_8: true,
    night8_9: true,
    night9_10: true,
    night10_11: false,
    night11_12: false,
    rodzajNoclegu: "Pokój 4-osobowy",
    wspolLokatorzy: "Jan Kowalski, Adam Malinowski, Rafał Wójcik",
    rezygnacjaNoclegu: false,
    przypisanyPokoj: "B-206",
    pelnyPakiet: false,
    obiadKolacja: true,
    tylkoObiad: false,
    dietaWegetarianska: false,
    innaDieta: "",
    ulatwionytDostep: false,
    dodatkowyObiad11: false,
    dodatkowaKolacja11: false,
    transportZBalic: true,
    transportNaBalice: false,
    wylot: "",
    kopertaPdf: false,
    identyfikatorPdf: true,
    skompletowanoKoperte: false,
    wydanoKoperte: false,
    wydanoKlucze: false,
    statusRezygnacji: false,
    paymentStatus: "Oczekuje",
    documentStatus: "-",
  },
  {
    id: 17,
    firstName: "Jan",
    lastName: "Kowalski",
    email: "jan.kowalski@example.pl",
    konwencja: true,
    chor: false,
    seminarium: false,
    day6: true,
    day7: true,
    day8: true,
    day9: true,
    day10: true,
    day11: false,
    night6_7: true,
    night7_8: true,
    night8_9: true,
    night9_10: true,
    night10_11: false,
    night11_12: false,
    rodzajNoclegu: "Pokój 4-osobowy",
    wspolLokatorzy: "Andrzej Lewandowski, Adam Malinowski, Rafał Wójcik",
    rezygnacjaNoclegu: false,
    przypisanyPokoj: "B-206",
    pelnyPakiet: true,
    obiadKolacja: false,
    tylkoObiad: false,
    dietaWegetarianska: false,
    innaDieta: "",
    ulatwionytDostep: false,
    dodatkowyObiad11: false,
    dodatkowaKolacja11: false,
    transportZBalic: true,
    transportNaBalice: true,
    wylot: "15:30",
    kopertaPdf: true,
    identyfikatorPdf: true,
    skompletowanoKoperte: true,
    wydanoKoperte: true,
    wydanoKlucze: true,
    statusRezygnacji: false,
    paymentStatus: "Opłacone",
    documentStatus: "Gotowy",
  },
  {
    id: 18,
    firstName: "Adam",
    lastName: "Malinowski",
    email: "adam.malinowski@example.pl",
    konwencja: true,
    chor: true,
    seminarium: false,
    day6: true,
    day7: true,
    day8: true,
    day9: true,
    day10: true,
    day11: true,
    night6_7: true,
    night7_8: true,
    night8_9: true,
    night9_10: true,
    night10_11: true,
    night11_12: true,
    rodzajNoclegu: "Pokój 4-osobowy",
    wspolLokatorzy: "Andrzej Lewandowski, Jan Kowalski, Rafał Wójcik",
    rezygnacjaNoclegu: false,
    przypisanyPokoj: "B-206",
    pelnyPakiet: true,
    obiadKolacja: false,
    tylkoObiad: false,
    dietaWegetarianska: true,
    innaDieta: "",
    ulatwionytDostep: false,
    dodatkowyObiad11: true,
    dodatkowaKolacja11: true,
    transportZBalic: false,
    transportNaBalice: false,
    wylot: "",
    kopertaPdf: true,
    identyfikatorPdf: true,
    skompletowanoKoperte: true,
    wydanoKoperte: false,
    wydanoKlucze: false,
    statusRezygnacji: false,
    paymentStatus: "Opłacone",
    documentStatus: "Gotowy",
  },
  {
    id: 19,
    firstName: "Rafał",
    lastName: "Wójcik",
    email: "rafal.wojcik@example.pl",
    konwencja: false,
    chor: false,
    seminarium: true,
    day6: false,
    day7: false,
    day8: true,
    day9: true,
    day10: true,
    day11: false,
    night6_7: false,
    night7_8: false,
    night8_9: true,
    night9_10: true,
    night10_11: false,
    night11_12: false,
    rodzajNoclegu: "Pokój 4-osobowy",
    wspolLokatorzy: "Andrzej Lewandowski, Jan Kowalski, Adam Malinowski",
    rezygnacjaNoclegu: false,
    przypisanyPokoj: "B-206",
    pelnyPakiet: false,
    obiadKolacja: false,
    tylkoObiad: true,
    dietaWegetarianska: false,
    innaDieta: "Keto",
    ulatwionytDostep: false,
    dodatkowyObiad11: false,
    dodatkowaKolacja11: false,
    transportZBalic: false,
    transportNaBalice: false,
    wylot: "",
    kopertaPdf: false,
    identyfikatorPdf: false,
    skompletowanoKoperte: false,
    wydanoKoperte: false,
    wydanoKlucze: false,
    statusRezygnacji: false,
    paymentStatus: "Nieopłacone",
    documentStatus: "-",
  },
  {
    id: 20,
    firstName: "Katarzyna",
    lastName: "Dąbrowska",
    email: "katarzyna.dabrowska@example.pl",
    konwencja: true,
    chor: true,
    seminarium: true,
    day6: true,
    day7: true,
    day8: true,
    day9: true,
    day10: true,
    day11: true,
    night6_7: true,
    night7_8: true,
    night8_9: true,
    night9_10: true,
    night10_11: true,
    night11_12: true,
    rodzajNoclegu: "Pokój 2-osobowy",
    wspolLokatorzy: "Ewa Mazur",
    rezygnacjaNoclegu: false,
    przypisanyPokoj: "A-103",
    pelnyPakiet: true,
    obiadKolacja: false,
    tylkoObiad: false,
    dietaWegetarianska: false,
    innaDieta: "",
    ulatwionytDostep: false,
    dodatkowyObiad11: true,
    dodatkowaKolacja11: true,
    transportZBalic: true,
    transportNaBalice: true,
    wylot: "17:00",
    kopertaPdf: true,
    identyfikatorPdf: true,
    skompletowanoKoperte: true,
    wydanoKoperte: true,
    wydanoKlucze: true,
    statusRezygnacji: false,
    paymentStatus: "Opłacone",
    documentStatus: "Gotowy",
  },
  {
    id: 21,
    firstName: "Ewa",
    lastName: "Mazur",
    email: "ewa.mazur@example.pl",
    konwencja: true,
    chor: false,
    seminarium: true,
    day6: true,
    day7: true,
    day8: true,
    day9: true,
    day10: true,
    day11: true,
    night6_7: true,
    night7_8: true,
    night8_9: true,
    night9_10: true,
    night10_11: true,
    night11_12: true,
    rodzajNoclegu: "Pokój 2-osobowy",
    wspolLokatorzy: "Katarzyna Dąbrowska",
    rezygnacjaNoclegu: false,
    przypisanyPokoj: "A-103",
    pelnyPakiet: true,
    obiadKolacja: false,
    tylkoObiad: false,
    dietaWegetarianska: true,
    innaDieta: "",
    ulatwionytDostep: false,
    dodatkowyObiad11: true,
    dodatkowaKolacja11: true,
    transportZBalic: true,
    transportNaBalice: true,
    wylot: "17:00",
    kopertaPdf: true,
    identyfikatorPdf: true,
    skompletowanoKoperte: true,
    wydanoKoperte: true,
    wydanoKlucze: true,
    statusRezygnacji: false,
    paymentStatus: "Opłacone",
    documentStatus: "Gotowy",
  },
  {
    id: 22,
    firstName: "Michał",
    lastName: "Jankowski",
    email: "michal.jankowski@example.pl",
    konwencja: true,
    chor: true,
    seminarium: false,
    day6: true,
    day7: true,
    day8: true,
    day9: false,
    day10: false,
    day11: false,
    night6_7: true,
    night7_8: true,
    night8_9: false,
    night9_10: false,
    night10_11: false,
    night11_12: false,
    rodzajNoclegu: "Pokój 1-osobowy",
    wspolLokatorzy: "",
    rezygnacjaNoclegu: false,
    przypisanyPokoj: "C-304",
    pelnyPakiet: false,
    obiadKolacja: true,
    tylkoObiad: false,
    dietaWegetarianska: false,
    innaDieta: "",
    ulatwionytDostep: false,
    dodatkowyObiad11: false,
    dodatkowaKolacja11: false,
    transportZBalic: true,
    transportNaBalice: false,
    wylot: "",
    kopertaPdf: true,
    identyfikatorPdf: true,
    skompletowanoKoperte: true,
    wydanoKoperte: false,
    wydanoKlucze: false,
    statusRezygnacji: false,
    paymentStatus: "Opłacone",
    documentStatus: "Gotowy",
  },
  {
    id: 23,
    firstName: "Zofia",
    lastName: "Pawlak",
    email: "zofia.pawlak@example.pl",
    konwencja: false,
    chor: true,
    seminarium: false,
    day6: false,
    day7: true,
    day8: true,
    day9: true,
    day10: true,
    day11: false,
    night6_7: false,
    night7_8: true,
    night8_9: true,
    night9_10: true,
    night10_11: false,
    night11_12: false,
    rodzajNoclegu: "Pokój 2-osobowy",
    wspolLokatorzy: "Anna Sikora",
    rezygnacjaNoclegu: false,
    przypisanyPokoj: "A-104",
    pelnyPakiet: true,
    obiadKolacja: false,
    tylkoObiad: false,
    dietaWegetarianska: false,
    innaDieta: "Bez glutenu i laktozy",
    ulatwionytDostep: true,
    dodatkowyObiad11: false,
    dodatkowaKolacja11: false,
    transportZBalic: false,
    transportNaBalice: false,
    wylot: "",
    kopertaPdf: false,
    identyfikatorPdf: true,
    skompletowanoKoperte: false,
    wydanoKoperte: false,
    wydanoKlucze: false,
    statusRezygnacji: false,
    paymentStatus: "Oczekuje",
    documentStatus: "-",
  },
  {
    id: 24,
    firstName: "Anna",
    lastName: "Sikora",
    email: "anna.sikora@example.pl",
    konwencja: true,
    chor: true,
    seminarium: true,
    day6: true,
    day7: true,
    day8: true,
    day9: true,
    day10: true,
    day11: false,
    night6_7: true,
    night7_8: true,
    night8_9: true,
    night9_10: true,
    night10_11: false,
    night11_12: false,
    rodzajNoclegu: "Pokój 2-osobowy",
    wspolLokatorzy: "Zofia Pawlak",
    rezygnacjaNoclegu: false,
    przypisanyPokoj: "A-104",
    pelnyPakiet: true,
    obiadKolacja: false,
    tylkoObiad: false,
    dietaWegetarianska: true,
    innaDieta: "",
    ulatwionytDostep: false,
    dodatkowyObiad11: false,
    dodatkowaKolacja11: false,
    transportZBalic: true,
    transportNaBalice: true,
    wylot: "14:30",
    kopertaPdf: true,
    identyfikatorPdf: true,
    skompletowanoKoperte: true,
    wydanoKoperte: true,
    wydanoKlucze: true,
    statusRezygnacji: false,
    paymentStatus: "Opłacone",
    documentStatus: "Gotowy",
  },
  {
    id: 25,
    firstName: "Paweł",
    lastName: "Król",
    email: "pawel.krol@example.pl",
    konwencja: true,
    chor: false,
    seminarium: false,
    day6: true,
    day7: true,
    day8: true,
    day9: true,
    day10: true,
    day11: true,
    night6_7: true,
    night7_8: true,
    night8_9: true,
    night9_10: true,
    night10_11: true,
    night11_12: true,
    rodzajNoclegu: "Pokój 1-osobowy",
    wspolLokatorzy: "",
    rezygnacjaNoclegu: false,
    przypisanyPokoj: "C-305",
    pelnyPakiet: true,
    obiadKolacja: false,
    tylkoObiad: false,
    dietaWegetarianska: false,
    innaDieta: "",
    ulatwionytDostep: false,
    dodatkowyObiad11: true,
    dodatkowaKolacja11: true,
    transportZBalic: false,
    transportNaBalice: true,
    wylot: "21:00",
    kopertaPdf: true,
    identyfikatorPdf: true,
    skompletowanoKoperte: true,
    wydanoKoperte: true,
    wydanoKlucze: true,
    statusRezygnacji: false,
    paymentStatus: "Opłacone",
    documentStatus: "Gotowy",
  },
  {
    id: 26,
    firstName: "Joanna",
    lastName: "Michalska",
    email: "joanna.michalska@example.pl",
    konwencja: true,
    chor: true,
    seminarium: true,
    day6: true,
    day7: true,
    day8: true,
    day9: true,
    day10: true,
    day11: true,
    night6_7: true,
    night7_8: true,
    night8_9: true,
    night9_10: true,
    night10_11: true,
    night11_12: true,
    rodzajNoclegu: "Pokój 2-osobowy",
    wspolLokatorzy: "Magdalena Grabowska",
    rezygnacjaNoclegu: false,
    przypisanyPokoj: "A-105",
    pelnyPakiet: true,
    obiadKolacja: false,
    tylkoObiad: false,
    dietaWegetarianska: false,
    innaDieta: "Wegańska",
    ulatwionytDostep: false,
    dodatkowyObiad11: true,
    dodatkowaKolacja11: true,
    transportZBalic: true,
    transportNaBalice: true,
    wylot: "16:00",
    kopertaPdf: true,
    identyfikatorPdf: true,
    skompletowanoKoperte: true,
    wydanoKoperte: false,
    wydanoKlucze: false,
    statusRezygnacji: false,
    paymentStatus: "Opłacone",
    documentStatus: "Gotowy",
  },
  {
    id: 27,
    firstName: "Magdalena",
    lastName: "Grabowska",
    email: "magdalena.grabowska@example.pl",
    konwencja: true,
    chor: false,
    seminarium: true,
    day6: true,
    day7: true,
    day8: true,
    day9: true,
    day10: true,
    day11: true,
    night6_7: true,
    night7_8: true,
    night8_9: true,
    night9_10: true,
    night10_11: true,
    night11_12: true,
    rodzajNoclegu: "Pokój 2-osobowy",
    wspolLokatorzy: "Joanna Michalska",
    rezygnacjaNoclegu: false,
    przypisanyPokoj: "A-105",
    pelnyPakiet: true,
    obiadKolacja: false,
    tylkoObiad: false,
    dietaWegetarianska: false,
    innaDieta: "",
    ulatwionytDostep: false,
    dodatkowyObiad11: true,
    dodatkowaKolacja11: true,
    transportZBalic: true,
    transportNaBalice: true,
    wylot: "16:00",
    kopertaPdf: true,
    identyfikatorPdf: true,
    skompletowanoKoperte: true,
    wydanoKoperte: false,
    wydanoKlucze: false,
    statusRezygnacji: false,
    paymentStatus: "Oczekuje",
    documentStatus: "-",
  },
  {
    id: 28,
    firstName: "Grzegorz",
    lastName: "Baran",
    email: "grzegorz.baran@example.pl",
    konwencja: false,
    chor: true,
    seminarium: false,
    day6: false,
    day7: true,
    day8: true,
    day9: true,
    day10: false,
    day11: false,
    night6_7: false,
    night7_8: true,
    night8_9: true,
    night9_10: false,
    night10_11: false,
    night11_12: false,
    rodzajNoclegu: "",
    wspolLokatorzy: "",
    rezygnacjaNoclegu: true,
    przypisanyPokoj: "",
    pelnyPakiet: false,
    obiadKolacja: false,
    tylkoObiad: true,
    dietaWegetarianska: false,
    innaDieta: "",
    ulatwionytDostep: false,
    dodatkowyObiad11: false,
    dodatkowaKolacja11: false,
    transportZBalic: false,
    transportNaBalice: false,
    wylot: "",
    kopertaPdf: false,
    identyfikatorPdf: false,
    skompletowanoKoperte: false,
    wydanoKoperte: false,
    wydanoKlucze: false,
    statusRezygnacji: false,
    paymentStatus: "Nieopłacone",
    documentStatus: "-",
  },
  {
    id: 29,
    firstName: "Monika",
    lastName: "Kaczmarek",
    email: "monika.kaczmarek@example.pl",
    konwencja: true,
    chor: true,
    seminarium: false,
    day6: true,
    day7: true,
    day8: true,
    day9: true,
    day10: true,
    day11: false,
    night6_7: true,
    night7_8: true,
    night8_9: true,
    night9_10: true,
    night10_11: false,
    night11_12: false,
    rodzajNoclegu: "Pokój 1-osobowy",
    wspolLokatorzy: "",
    rezygnacjaNoclegu: false,
    przypisanyPokoj: "C-306",
    pelnyPakiet: true,
    obiadKolacja: false,
    tylkoObiad: false,
    dietaWegetarianska: true,
    innaDieta: "",
    ulatwionytDostep: false,
    dodatkowyObiad11: false,
    dodatkowaKolacja11: false,
    transportZBalic: true,
    transportNaBalice: true,
    wylot: "13:45",
    kopertaPdf: true,
    identyfikatorPdf: true,
    skompletowanoKoperte: true,
    wydanoKoperte: true,
    wydanoKlucze: true,
    statusRezygnacji: false,
    paymentStatus: "Opłacone",
    documentStatus: "Gotowy",
  },
  {
    id: 30,
    firstName: "Robert",
    lastName: "Piotrowski",
    email: "robert.piotrowski@example.pl",
    konwencja: true,
    chor: false,
    seminarium: true,
    day6: true,
    day7: true,
    day8: false,
    day9: true,
    day10: true,
    day11: true,
    night6_7: true,
    night7_8: false,
    night8_9: false,
    night9_10: true,
    night10_11: true,
    night11_12: true,
    rodzajNoclegu: "Pokój 2-osobowy",
    wspolLokatorzy: "Marcin Szymański",
    rezygnacjaNoclegu: false,
    przypisanyPokoj: "D-402",
    pelnyPakiet: false,
    obiadKolacja: true,
    tylkoObiad: false,
    dietaWegetarianska: false,
    innaDieta: "Niskokaloryczna",
    ulatwionytDostep: false,
    dodatkowyObiad11: true,
    dodatkowaKolacja11: false,
    transportZBalic: false,
    transportNaBalice: true,
    wylot: "18:30",
    kopertaPdf: true,
    identyfikatorPdf: true,
    skompletowanoKoperte: true,
    wydanoKoperte: false,
    wydanoKlucze: false,
    statusRezygnacji: false,
    paymentStatus: "Opłacone",
    documentStatus: "Gotowy",
  },
]

// Attendance days configuration
const attendanceDays = [
  { key: "day6", label: "6 sierpnia", weekday: "Wtorek" },
  { key: "day7", label: "7 sierpnia", weekday: "Środa" },
  { key: "day8", label: "8 sierpnia", weekday: "Czwartek" },
  { key: "day9", label: "9 sierpnia", weekday: "Piątek" },
  { key: "day10", label: "10 sierpnia", weekday: "Sobota" },
  { key: "day11", label: "11 sierpnia", weekday: "Niedziela" },
]

// Accommodation nights configuration
const accommodationNights = [
  { key: "night6_7", label: "06/07.08", weekdays: "Wt/Śr" },
  { key: "night7_8", label: "07/08.08", weekdays: "Śr/Cz" },
  { key: "night8_9", label: "08/09.08", weekdays: "Cz/Pt" },
  { key: "night9_10", label: "09/10.08", weekdays: "Pt/Sb" },
  { key: "night10_11", label: "10/11.08", weekdays: "Sb/Nd" },
  { key: "night11_12", label: "11/12.08", weekdays: "Nd/Pn" },
]

function BooleanCell({ value, positive = true }) {
  if (value) {
    return (
      <div className="flex items-center justify-center">
        <CheckCircle2
          className={`h-5 w-5 ${positive ? "text-green-600" : "text-red-600"}`}
          aria-label={positive ? "Tak" : "Nie"}
        />
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center">
      <Minus className="h-4 w-4 text-muted-foreground/40" aria-label="Nie dotyczy" />
    </div>
  )
}

export default function ParticipantsPage() {
  const navigate = useNavigate()
  const { selectedProjectId, selectedProject } = useProject()
  const { data: apiParticipants, isLoading: isLoadingParticipants } = useParticipants()
  
  // Use API data if available, otherwise fall back to mock data for now
  // TODO: Remove mock data fallback when backend API is ready
  const [participants, setParticipants] = useState(initialParticipants)
  const [searchQuery, setSearchQuery] = useState("")
  const [eventTypeFilter, setEventTypeFilter] = useState("Wszystkie")
  const [selectedRows, setSelectedRows] = useState([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingParticipant, setEditingParticipant] = useState(null)
  const [generationTargetIds, setGenerationTargetIds] = useState([])
  const [selectedDocumentTypes, setSelectedDocumentTypes] = useState({
    identyfikator: false,
    koperta: false,
    rachunek: false,
  })
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    eventType: "choir",
    paymentStatus: "Oczekuje",
  })

  const { toast } = useToast()

  // Update participants when API data is available
  // TODO: Remove this when backend API is ready and returns actual data
  useEffect(() => {
    if (apiParticipants && apiParticipants.length > 0) {
      setParticipants(apiParticipants)
    }
    // Note: For now, we keep using mock data until backend endpoint is implemented
  }, [apiParticipants])

  // Show message if no project is selected
  if (!selectedProjectId) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Wybierz projekt, aby wyświetlić listę uczestników.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Filter participants based on search and event type
  const filteredParticipants = participants.filter((participant) => {
    const fullName = `${participant.firstName} ${participant.lastName}`.toLowerCase()
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      participant.email.toLowerCase().includes(searchQuery.toLowerCase())

    let matchesEventType = eventTypeFilter === "Wszystkie"
    if (eventTypeFilter === "konwencja") matchesEventType = participant.konwencja
    if (eventTypeFilter === "choir") matchesEventType = participant.chor
    if (eventTypeFilter === "seminar") matchesEventType = participant.seminarium

    return matchesSearch && matchesEventType
  })

  // Toggle row selection
  const toggleRowSelection = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
  }

  // Toggle all rows selection
  const toggleAllRows = () => {
    if (selectedRows.length === filteredParticipants.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(filteredParticipants.map((p) => p.id))
    }
  }

  // Toggle payment status
  const togglePaymentStatus = (id) => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const statuses = ["Opłacone", "Nieopłacone", "Oczekuje"]
          const currentIndex = statuses.indexOf(p.paymentStatus)
          const nextIndex = (currentIndex + 1) % statuses.length
          return { ...p, paymentStatus: statuses[nextIndex] }
        }
        return p
      }),
    )
    toast({
      title: "Status płatności zaktualizowany",
      description: "Zmiany zostały zapisane",
    })
  }

  // Open generation dialog for bulk action (selected rows)
  const openGenerateDialogForBulk = () => {
    if (selectedRows.length === 0) return
    setGenerationTargetIds([...selectedRows])
    setSelectedDocumentTypes({
      identyfikator: false,
      koperta: false,
      rachunek: false,
    })
  }

  // Open generation dialog for single participant
  const openGenerateDialogForSingle = (participantId) => {
    setGenerationTargetIds([participantId])
    setSelectedDocumentTypes({
      identyfikator: false,
      koperta: false,
      rachunek: false,
    })
  }

  // Toggle document type selection
  const toggleDocumentType = (type) => {
    setSelectedDocumentTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }))
  }

  // Check if any document type is selected
  const hasSelectedDocumentTypes = Object.values(selectedDocumentTypes).some((value) => value)

  // Handle final confirmation from the dialog
  const confirmGeneration = () => {
    const count = generationTargetIds.length
    const documentTypeLabels = {
      identyfikator: "Identyfikatory",
      koperta: "Koperty",
      rachunek: "Rachunki",
    }
    const selectedTypes = Object.keys(selectedDocumentTypes)
      .filter((key) => selectedDocumentTypes[key])
      .map((key) => documentTypeLabels[key])
      .join(", ")

    const targetIds = [...generationTargetIds]
    setGenerationTargetIds([])

    toast({
      title: `Zlecono generowanie (${selectedTypes}) dla ${count} os.`,
      description: count > 20 ? "Proces odbędzie się w tle" : "Pliki zostaną pobrane bezpośrednio",
    })

    setTimeout(() => {
      setParticipants((prev) => prev.map((p) => (targetIds.includes(p.id) ? { ...p, documentStatus: "Gotowy" } : p)))
      setSelectedRows([])
      toast({
        title: "Dokumenty wygenerowane!",
        description: `${count} dokumentów zostało utworzonych`,
      })
    }, 2000)
  }

  // Open add modal
  const openAddModal = () => {
    setEditingParticipant(null)
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      eventType: "choir",
      paymentStatus: "Oczekuje",
    })
    setIsAddModalOpen(true)
  }

  // Open edit modal
  const openEditModal = (participant) => {
    setEditingParticipant(participant)
    setFormData({
      firstName: participant.firstName,
      lastName: participant.lastName,
      email: participant.email,
      eventType: participant.chor ? "choir" : participant.seminarium ? "seminar" : "convention",
      paymentStatus: participant.paymentStatus,
    })
    setIsAddModalOpen(true)
  }

  // Save participant
  const saveParticipant = () => {
    if (editingParticipant) {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === editingParticipant.id
            ? {
                ...p,
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                paymentStatus: formData.paymentStatus,
                chor: formData.eventType === "choir",
                seminarium: formData.eventType === "seminar",
                konwencja: formData.eventType === "convention",
              }
            : p,
        ),
      )
      toast({
        title: "Uczestnik zaktualizowany",
        description: "Zmiany zostały zapisane",
      })
    } else {
      const newParticipant = {
        id: Math.max(...participants.map((p) => p.id)) + 1,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        konwencja: formData.eventType === "convention",
        chor: formData.eventType === "choir",
        seminarium: formData.eventType === "seminar",
        day6: false,
        day7: false,
        day8: false,
        day9: false,
        day10: false,
        day11: false,
        night6_7: false,
        night7_8: false,
        night8_9: false,
        night9_10: false,
        night10_11: false,
        night11_12: false,
        rodzajNoclegu: "",
        wspolLokatorzy: "",
        rezygnacjaNoclegu: false,
        przypisanyPokoj: "",
        pelnyPakiet: false,
        obiadKolacja: false,
        tylkoObiad: false,
        dietaWegetarianska: false,
        innaDieta: "",
    ulatwionytDostep: false,
        dodatkowyObiad11: false,
        dodatkowaKolacja11: false,
        transportZBalic: false,
        transportNaBalice: false,
        wylot: "",
        kopertaPdf: false,
        identyfikatorPdf: false,
        skompletowanoKoperte: false,
        wydanoKoperte: false,
        wydanoKlucze: false,
        statusRezygnacji: false,
        paymentStatus: formData.paymentStatus,
        documentStatus: "-",
      }
      setParticipants((prev) => [...prev, newParticipant])
      toast({
        title: "Uczestnik dodany",
        description: "Nowy uczestnik został dodany do listy",
      })
    }
    setIsAddModalOpen(false)
  }

  // Get payment status badge
  const getPaymentBadge = (status) => {
    const variants = {
      Opłacone: {
        className: "bg-green-600 hover:bg-green-700 text-white border-0",
        icon: CheckCircle2,
      },
      Nieopłacone: {
        className: "bg-red-600 hover:bg-red-700 text-white border-0",
        icon: XCircle,
      },
      Oczekuje: {
        className: "bg-amber-500 hover:bg-amber-600 text-white border-0",
        icon: Clock,
      },
    }
    const config = variants[status]
    const Icon = config.icon
    return (
      <Badge
        className={`${config.className} inline-flex min-w-[110px] items-center justify-center gap-1.5 px-3 py-1 text-xs font-semibold whitespace-nowrap`}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span>{status}</span>
      </Badge>
    )
  }

  const getRowBgClass = (participant, isSticky = false, rowIndex = 0) => {
    if (participant.statusRezygnacji) {
      return isSticky ? "bg-red-100" : "bg-red-50"
    }
    // Efekt zebry - co drugi wiersz lekko ciemniejszy
    const isEvenRow = rowIndex % 2 === 1
    if (isEvenRow) {
      return isSticky ? "bg-gray-100" : "bg-gray-50"
    }
    return "bg-white"
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-[1800px] space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Panel Uczestników</h1>
          <p className="text-muted-foreground">Zarządzaj uczestnikami i generuj dokumenty</p>
        </div>

        {/* Top Toolbar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Search */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Szukaj uczestnika..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-11 text-base"
            />
          </div>

          {/* Middle: Filter */}
          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <SelectTrigger className="h-12 w-full text-base lg:w-56">
              <SelectValue placeholder="Typ wydarzenia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Wszystkie">Wszystkie wydarzenia</SelectItem>
              <SelectItem value="konwencja">Konwencja</SelectItem>
              <SelectItem value="choir">Chór</SelectItem>
              <SelectItem value="seminar">Seminarium</SelectItem>
            </SelectContent>
          </Select>

          {/* Right: Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={openGenerateDialogForBulk}
              disabled={selectedRows.length === 0}
              className="h-12 px-5 text-base"
            >
              <FileText className="mr-2 h-5 w-5" />
              Generuj zaznaczone ({selectedRows.length})
            </Button>
            <Button size="lg" onClick={() => navigate('/participants/add')} className="h-12 px-5 text-base">
              <Plus className="mr-2 h-5 w-5" />
              Dodaj Uczestnika
            </Button>
          </div>
        </div>

        <div className="rounded-xl border-2 border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                {/* Super headers (Group headers) */}
                <tr>
                  <th
                    colSpan={4}
                    className="sticky left-0 z-30 h-12 border-b-2 border-r-2 border-border bg-gray-100 px-3 text-center text-xs font-bold uppercase tracking-wider text-gray-700"
                  >
                    Dane Podstawowe
                  </th>
                  <th
                    colSpan={3}
                    className="h-12 border-b-2 border-r-2 border-border bg-blue-100 px-3 text-center text-xs font-bold uppercase tracking-wider text-blue-900"
                  >
                    Uczestnictwo – Rodzaj Wydarzenia
                  </th>
                  <th
                    colSpan={6}
                    className="h-12 border-b-2 border-r-2 border-border bg-green-100 px-3 text-center text-xs font-bold uppercase tracking-wider text-green-900"
                  >
                    Udział w Dniach
                  </th>
                  <th
                    colSpan={10}
                    className="h-12 border-b-2 border-r-2 border-border bg-purple-100 px-3 text-center text-xs font-bold uppercase tracking-wider text-purple-900"
                  >
                    Zakwaterowanie
                  </th>
                  <th
                    colSpan={3}
                    className="h-12 border-b-2 border-r-2 border-border bg-yellow-100 px-3 text-center text-xs font-bold uppercase tracking-wider text-yellow-900"
                  >
                    Posiłki w czasie konwencji
                  </th>
                  <th
                    colSpan={7}
                    className="h-12 border-b-2 border-r-2 border-border bg-orange-100 px-3 text-center text-xs font-bold uppercase tracking-wider text-orange-900"
                  >
                    Informacje dodatkowe
                  </th>
                  <th
                    colSpan={8}
                    className="h-12 border-b-2 border-border bg-red-100 px-3 text-center text-xs font-bold uppercase tracking-wider text-red-900"
                  >
                    Logistyka i Statusy
                  </th>
                </tr>

                {/* Column headers */}
                <tr>
                  <th className="sticky left-0 z-30 h-14 min-w-[56px] max-w-[56px] border-b border-border bg-white px-3 text-center">
                    <Checkbox
                      checked={selectedRows.length === filteredParticipants.length && filteredParticipants.length > 0}
                      onCheckedChange={toggleAllRows}
                      className="h-5 w-5"
                    />
                  </th>
                  <th className="sticky left-[56px] z-30 h-14 min-w-[60px] max-w-[60px] border-b border-border bg-white px-3 text-left text-sm font-semibold text-foreground">
                    ID
                  </th>
                  <th className="sticky left-[116px] z-30 h-14 min-w-[100px] max-w-[100px] border-b border-border bg-white px-3 text-left text-sm font-semibold text-foreground">
                    Imię
                  </th>
                  <th className="sticky left-[216px] z-30 h-14 min-w-[120px] max-w-[120px] border-b border-r-2 border-border bg-white px-3 text-left text-sm font-semibold text-foreground">
                    Nazwisko
                  </th>

                  {/* Event type columns */}
                  <th className="h-14 min-w-[110px] border-b border-border bg-blue-50 px-3 text-center text-sm font-semibold text-foreground">
                    Konwencja
                  </th>
                  <th className="h-14 min-w-[90px] border-b border-border bg-orange-50 px-3 text-center text-sm font-semibold text-foreground">
                    Chór
                  </th>
                  <th className="h-14 min-w-[110px] border-b border-r-2 border-border bg-orange-50 px-3 text-center text-sm font-semibold text-foreground">
                    Seminarium
                  </th>

                  {/* Attendance days columns */}
                  {attendanceDays.map((day, idx) => (
                    <th
                      key={day.key}
                      className={`h-14 min-w-[90px] border-b border-border bg-green-50 px-2 text-center ${
                        idx === attendanceDays.length - 1 ? "border-r-2" : ""
                      }`}
                    >
                      <div className="flex flex-col items-center leading-tight">
                        <span className="text-xs font-bold text-foreground">{day.label}</span>
                        <span className="text-xs text-muted-foreground">{day.weekday}</span>
                      </div>
                    </th>
                  ))}

                  {/* Accommodation nights columns */}
                  {accommodationNights.map((night, idx) => (
                    <th
                      key={night.key}
                      className="h-14 min-w-[80px] border-b border-border bg-purple-50 px-2 text-center"
                    >
                      <div className="flex flex-col items-center leading-tight">
                        <span className="text-xs font-bold text-foreground">{night.label}</span>
                        <span className="text-xs text-muted-foreground">{night.weekdays}</span>
                      </div>
                    </th>
                  ))}

                  {/* Accommodation details columns - część sekcji Zakwaterowanie */}
                  <th className="h-14 min-w-[140px] border-b border-border bg-purple-50 px-3 text-left text-sm font-semibold text-foreground">
                    Rodzaj noclegu
                  </th>
                  <th className="h-14 min-w-[180px] border-b border-border bg-purple-50 px-3 text-left text-sm font-semibold text-foreground">
                    Współlokatorzy
                  </th>
                  <th className="h-14 min-w-[120px] border-b border-border bg-purple-50 px-3 text-center text-sm font-semibold text-foreground">
                    Rezygnacja z noclegu
                  </th>
                  <th className="h-14 min-w-[100px] border-b border-r-2 border-border bg-purple-50 px-3 text-left text-sm font-semibold text-foreground">
                    Przypisany pokój
                  </th>

                  {/* Meals columns - Posiłki w czasie konwencji */}
                  <th className="h-14 min-w-[120px] border-b border-border bg-yellow-50 px-3 text-center text-sm font-semibold text-foreground">
                    Pełny pakiet
                  </th>
                  <th className="h-14 min-w-[110px] border-b border-border bg-yellow-50 px-3 text-center text-sm font-semibold text-foreground">
                    Obiad + Kolacja
                  </th>
                  <th className="h-14 min-w-[100px] border-b border-r-2 border-border bg-yellow-50 px-3 text-center text-sm font-semibold text-foreground">
                    Tylko obiad
                  </th>

                  {/* Informacje dodatkowe */}
                  <th className="h-14 min-w-[110px] border-b border-border bg-orange-50 px-3 text-center text-sm font-semibold text-foreground">
                    Wegetariańska
                  </th>
                  <th className="h-14 min-w-[130px] border-b border-border bg-orange-50 px-3 text-left text-sm font-semibold text-foreground">
                    Inna dieta
                  </th>
                  <th className="h-14 min-w-[130px] border-b border-border bg-orange-50 px-3 text-center text-sm font-semibold text-foreground">
                    Ułatwiony dostęp
                  </th>
                  <th className="h-14 min-w-[120px] border-b border-border bg-orange-50 px-3 text-center text-sm font-semibold text-foreground">
                    +Obiad 11.08
                  </th>
                  <th className="h-14 min-w-[120px] border-b border-border bg-orange-50 px-3 text-center text-sm font-semibold text-foreground">
                    +Kolacja 11.08
                  </th>
                  <th className="h-14 min-w-[110px] border-b border-border bg-orange-50 px-3 text-center text-sm font-semibold text-foreground">
                    Transport z Balic
                  </th>
                  <th className="h-14 min-w-[110px] border-b border-r-2 border-border bg-orange-50 px-3 text-center text-sm font-semibold text-foreground">
                    Transport na Balice
                  </th>

                  {/* Logistics columns - Logistyka i Statusy */}
                  <th className="h-14 min-w-[100px] border-b border-border bg-red-50 px-3 text-left text-sm font-semibold text-foreground">
                    Wylot
                  </th>
                  <th className="h-14 min-w-[100px] border-b border-border bg-red-50 px-3 text-center text-sm font-semibold text-foreground">
                    Koperta PDF
                  </th>
                  <th className="h-14 min-w-[100px] border-b border-border bg-red-50 px-3 text-center text-sm font-semibold text-foreground">
                    ID PDF
                  </th>
                  <th className="h-14 min-w-[120px] border-b border-border bg-red-50 px-3 text-center text-sm font-semibold text-foreground">
                    Skompletowano kopertę
                  </th>
                  <th className="h-14 min-w-[120px] border-b border-border bg-red-50 px-3 text-center text-sm font-semibold text-foreground">
                    Wydano kopertę
                  </th>
                  <th className="h-14 min-w-[120px] border-b border-border bg-red-50 px-3 text-center text-sm font-semibold text-foreground">
                    Wydano klucze
                  </th>
                  <th className="h-14 min-w-[100px] border-b border-border bg-red-50 px-3 text-center text-sm font-semibold text-foreground">
                    REZYGNACJA
                  </th>
                  <th className="h-14 min-w-[80px] border-b border-border bg-red-50 px-3 text-center text-sm font-semibold text-foreground">
                    Akcje
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={41} className="py-16 text-center">
                      <p className="text-lg text-muted-foreground">Nie znaleziono uczestników</p>
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((participant, index) => (
                    <tr
                      key={participant.id}
                      className={`transition-colors hover:bg-blue-100 cursor-pointer ${
                        participant.statusRezygnacji 
                          ? "bg-red-50" 
                          : index % 2 === 1 
                            ? "bg-gray-50" 
                            : "bg-white"
                      }`}
                      onDoubleClick={() => navigate(`/participants/edit/${participant.id}`)}
                    >
                      <td
                        className={`sticky left-0 z-20 h-14 min-w-[56px] max-w-[56px] border-b border-border px-3 text-center ${getRowBgClass(participant, true, index)}`}
                      >
                        <Checkbox
                          checked={selectedRows.includes(participant.id)}
                          onCheckedChange={() => toggleRowSelection(participant.id)}
                          className="h-5 w-5"
                        />
                      </td>
                      <td
                        className={`sticky left-[56px] z-20 h-14 min-w-[60px] max-w-[60px] border-b border-border px-3 font-mono text-sm ${getRowBgClass(participant, true, index)}`}
                      >
                        #{participant.id}
                      </td>
                      <td
                        className={`sticky left-[116px] z-20 h-14 min-w-[100px] max-w-[100px] border-b border-border px-3 font-semibold ${getRowBgClass(participant, true, index)}`}
                      >
                        {participant.firstName}
                      </td>
                      <td
                        className={`sticky left-[216px] z-20 h-14 min-w-[120px] max-w-[120px] border-b border-r-2 border-border px-3 font-semibold ${getRowBgClass(participant, true, index)}`}
                      >
                        {participant.lastName}
                      </td>

                      {/* Event type - badge'y */}
                      <td className="h-14 min-w-[110px] border-b border-border px-3 text-center">
                        {participant.konwencja && (
                          <Badge className="inline-flex min-w-[90px] items-center justify-center bg-blue-100 text-blue-800 hover:bg-blue-200">
                            Konwencja
                          </Badge>
                        )}
                      </td>
                      <td className="h-14 min-w-[90px] border-b border-border px-3 text-center">
                        {participant.chor && (
                          <Badge className="inline-flex min-w-[60px] items-center justify-center bg-orange-100 text-orange-800 hover:bg-orange-200">
                            Chór
                          </Badge>
                        )}
                      </td>
                      <td className="h-14 min-w-[110px] border-b border-r-2 border-border px-3 text-center">
                        {participant.seminarium && (
                          <Badge className="inline-flex min-w-[90px] items-center justify-center bg-orange-100 text-orange-800 hover:bg-orange-200">
                            Seminarium
                          </Badge>
                        )}
                      </td>

                      {/* Attendance days */}
                      {attendanceDays.map((day, idx) => (
                        <td
                          key={day.key}
                          className={`h-14 min-w-[90px] border-b border-border px-2 ${
                            idx === attendanceDays.length - 1 ? "border-r-2" : ""
                          }`}
                        >
                          <BooleanCell value={participant[day.key]} />
                        </td>
                      ))}

                      {/* Accommodation nights */}
                      {accommodationNights.map((night, idx) => (
                        <td
                          key={night.key}
                          className="h-14 min-w-[80px] border-b border-border px-2"
                        >
                          <BooleanCell value={participant[night.key]} />
                        </td>
                      ))}

                      {/* Accommodation details - część sekcji Zakwaterowanie */}
                      <td className="min-h-14 min-w-[140px] border-b border-border px-3 py-2 text-sm">
                        {participant.rodzajNoclegu || <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="min-h-14 min-w-[180px] border-b border-border px-3 py-2 text-sm">
                        {participant.wspolLokatorzy || <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="h-14 min-w-[120px] border-b border-border px-3">
                        <BooleanCell value={participant.rezygnacjaNoclegu} />
                      </td>
                      <td className="h-14 min-w-[100px] border-b border-r-2 border-border px-3 font-mono text-sm font-bold">
                        {participant.przypisanyPokoj || <span className="text-muted-foreground">—</span>}
                      </td>

                      {/* Meals - Posiłki w czasie konwencji */}
                      <td className="h-14 min-w-[120px] border-b border-border px-3">
                        <BooleanCell value={participant.pelnyPakiet} />
                      </td>
                      <td className="h-14 min-w-[110px] border-b border-border px-3">
                        <BooleanCell value={participant.obiadKolacja} />
                      </td>
                      <td className="h-14 min-w-[100px] border-b border-r-2 border-border px-3">
                        <BooleanCell value={participant.tylkoObiad} />
                      </td>

                      {/* Informacje dodatkowe */}
                      <td className="h-14 min-w-[110px] border-b border-border px-3">
                        <BooleanCell value={participant.dietaWegetarianska} />
                      </td>
                      <td className="min-h-14 min-w-[130px] border-b border-border px-3 py-2 text-sm">
                        {participant.innaDieta || <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="h-14 min-w-[130px] border-b border-border px-3">
                        <BooleanCell value={participant.ulatwionytDostep} />
                      </td>
                      <td className="h-14 min-w-[120px] border-b border-border px-3">
                        <BooleanCell value={participant.dodatkowyObiad11} />
                      </td>
                      <td className="h-14 min-w-[120px] border-b border-border px-3">
                        <BooleanCell value={participant.dodatkowaKolacja11} />
                      </td>
                      <td className="h-14 min-w-[110px] border-b border-border px-3">
                        <BooleanCell value={participant.transportZBalic} />
                      </td>
                      <td className="h-14 min-w-[110px] border-b border-r-2 border-border px-3">
                        <BooleanCell value={participant.transportNaBalice} />
                      </td>

                      {/* Logistics - Logistyka i Statusy */}
                      <td className="h-14 min-w-[100px] border-b border-border px-3 font-mono text-sm">
                        {participant.wylot || <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="h-14 min-w-[100px] border-b border-border px-3">
                        <BooleanCell value={participant.kopertaPdf} />
                      </td>
                      <td className="h-14 min-w-[100px] border-b border-border px-3">
                        <BooleanCell value={participant.identyfikatorPdf} />
                      </td>
                      <td className="h-14 min-w-[120px] border-b border-border px-3">
                        <BooleanCell value={participant.skompletowanoKoperte} />
                      </td>
                      <td className="h-14 min-w-[120px] border-b border-border px-3">
                        <BooleanCell value={participant.wydanoKoperte} />
                      </td>
                      <td className="h-14 min-w-[120px] border-b border-border px-3">
                        <BooleanCell value={participant.wydanoKlucze} />
                      </td>
                      <td className="h-14 min-w-[100px] border-b border-border px-3">
                        <BooleanCell value={participant.statusRezygnacji} positive={false} />
                      </td>
                      <td className="h-14 min-w-[80px] border-b border-border px-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10">
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="z-50 w-56">
                            <DropdownMenuItem onClick={() => navigate(`/participants/edit/${participant.id}`)} className="h-11 text-base">
                              <Edit className="mr-2 h-5 w-5" />
                              Edytuj dane
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openGenerateDialogForSingle(participant.id)}
                              className="h-11 text-base font-semibold"
                            >
                              <FileText className="mr-2 h-5 w-5" />
                              Generuj dokumenty
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results count */}
        <div className="text-base text-muted-foreground">
          Wyświetlono <strong>{filteredParticipants.length}</strong> z <strong>{participants.length}</strong>{" "}
          uczestników
        </div>
      </div>

      {/* Add/Edit Participant Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingParticipant ? "Edytuj Uczestnika" : "Dodaj Uczestnika"}
            </DialogTitle>
            <DialogDescription className="text-base">
              {editingParticipant ? "Zaktualizuj dane uczestnika" : "Wprowadź dane nowego uczestnika"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-base">
                Imię
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Jan"
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-base">
                Nazwisko
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Kowalski"
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jan.kowalski@example.pl"
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventType" className="text-base">
                Typ Wydarzenia
              </Label>
              <Select
                value={formData.eventType}
                onValueChange={(value) => setFormData({ ...formData, eventType: value })}
              >
                <SelectTrigger id="eventType" className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="choir">Chór</SelectItem>
                  <SelectItem value="seminar">Seminarium</SelectItem>
                  <SelectItem value="convention">Konwencja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentStatus" className="text-base">
                Status Płatności
              </Label>
              <Select
                value={formData.paymentStatus}
                onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}
              >
                <SelectTrigger id="paymentStatus" className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Opłacone">Opłacone</SelectItem>
                  <SelectItem value="Nieopłacone">Nieopłacone</SelectItem>
                  <SelectItem value="Oczekuje">Oczekuje</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="h-11 text-base">
              Anuluj
            </Button>
            <Button onClick={saveParticipant} className="h-11 text-base">
              {editingParticipant ? "Zapisz zmiany" : "Dodaj uczestnika"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Generation Dialog */}
      <Dialog open={generationTargetIds.length > 0} onOpenChange={() => setGenerationTargetIds([])}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {generationTargetIds.length === 1
                ? "Generowanie dokumentów dla 1 uczestnika"
                : `Generowanie dokumentów dla ${generationTargetIds.length} uczestników`}
            </DialogTitle>
            <DialogDescription className="text-base">Wybierz typy dokumentów i potwierdź operację</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Document Type Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Typy dokumentów</Label>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="doc-identyfikator"
                    checked={selectedDocumentTypes.identyfikator}
                    onCheckedChange={() => toggleDocumentType("identyfikator")}
                    className="h-5 w-5"
                  />
                  <Label htmlFor="doc-identyfikator" className="cursor-pointer text-base font-normal">
                    Identyfikatory
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="doc-koperta"
                    checked={selectedDocumentTypes.koperta}
                    onCheckedChange={() => toggleDocumentType("koperta")}
                    className="h-5 w-5"
                  />
                  <Label htmlFor="doc-koperta" className="cursor-pointer text-base font-normal">
                    Koperty
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="doc-rachunek"
                    checked={selectedDocumentTypes.rachunek}
                    onCheckedChange={() => toggleDocumentType("rachunek")}
                    className="h-5 w-5"
                  />
                  <Label htmlFor="doc-rachunek" className="cursor-pointer text-base font-normal">
                    Rachunki
                  </Label>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-base font-medium">
                  Wybrano uczestników: <span className="font-bold">{generationTargetIds.length}</span>
                </p>
              </div>
              {generationTargetIds.length <= 20 ? (
                <p className="text-base text-muted-foreground">Pliki zostaną pobrane bezpośrednio.</p>
              ) : (
                <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                  <AlertDescription className="text-base text-yellow-800 dark:text-yellow-200">
                    Wybrano dużą liczbę uczestników ({generationTargetIds.length}). Proces odbędzie się w tle.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerationTargetIds([])} className="h-11 text-base">
              Anuluj
            </Button>
            <Button onClick={confirmGeneration} disabled={!hasSelectedDocumentTypes} className="h-11 text-base">
              Zleć generowanie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
