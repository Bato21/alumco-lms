-- PROPUESTA: no aplicada. La corre Bato en el dashboard cuando esté de acuerdo.
-- Hora límite opcional para las tareas de evento. Los eventos duran 1-2 días,
-- así que además de la fecha (default = fecha del evento en la UI) se quiere
-- indicar a qué hora debe estar lista una tarea.
--
-- Columna aditiva y nullable: no rompe nada existente. Mientras no se aplique,
-- el frontend degrada solo (guarda la tarea sin hora — ver isColumnaFaltante
-- en src/lib/actions/events.ts).

alter table public.event_tasks
  add column if not exists due_time time;
