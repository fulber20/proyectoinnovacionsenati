const mysql = require("mysql2")
const bcrypt = require("bcrypt")

// Pool de conexiones
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "", // cambia si tu BD tiene pass
  database: "ciaradmin",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

pool.on("error", (err) => {
  console.error("Error en pool de MySQL:", err)
})

const promisePool = pool.promise()

// Insertar usuario (para registro de gerente/admin)
async function insertarUsuario(nombres, apellidos, email, password, rol) {
  try {
    const saltRounds = 10
    const hash = await bcrypt.hash(password, saltRounds)
    const codigo_user = `USR${Math.floor(1000 + Math.random() * 9000)}`
    const [result] = await promisePool.query(
      "INSERT INTO usuarios (nombres, apellidos, email, password, rol, codigo_user) VALUES (?, ?, ?, ?, ?, ?)",
      [nombres, apellidos, email, hash, rol, codigo_user],
    )
    console.log("Usuario insertado con ID:", result.insertId)
    return { id: result.insertId }
  } catch (err) {
    console.error("Error en insertarUsuario:", err.message)
    throw err
  }
}

// Verificar si ya existe un Gerente
async function verificarGerente() {
  try {
    const [rows] = await promisePool.query("SELECT COUNT(*) AS count FROM usuarios WHERE rol = ?", ["Gerente"])
    console.log("Conteo de gerentes:", rows[0].count)
    return rows[0].count > 0
  } catch (err) {
    console.error("Error en verificarGerente:", err.message)
    throw err
  }
}

// Insertar empleado normal
async function insertarEmpleado({ nombres, apellidos, email, password, rol, estado, ocupacion, tipo_contrato }) {
  console.log("Datos recibidos en insertarEmpleado:", { nombres, apellidos, email, password, rol, estado, ocupacion, tipo_contrato }); // Nuevo log
  try {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    const [result] = await promisePool.query(
      "INSERT INTO usuarios (nombres, apellidos, email, password, rol, estado, ocupacion, tipo_contrato) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [nombres, apellidos, email, hash, rol, estado, ocupacion, tipo_contrato]
    );

    console.log("Empleado insertado con ID:", result.insertId);
    return { id: result.insertId };
  } catch (err) {
    console.error("Error en insertarEmpleado:", err.message);
    throw err;
  }
}
// Listar empleados
async function listarEmpleados() {
  try {
    const [rows] = await promisePool.query("SELECT * FROM usuarios")
    return rows
  } catch (err) {
    console.error("Error en listarEmpleados:", err.message)
    throw err
  }
}

async function autenticarUsuario(identifier, password) {
  try {
    console.log("[v0] Buscando usuario con identifier:", identifier);

    const [rows] = await promisePool.query(
      "SELECT id_user, nombres, apellidos, email, codigo_user, rol, estado, password FROM usuarios WHERE (email = ? OR codigo_user = ?) AND estado = ?",
      [identifier, identifier, "Activo"]
    );

    console.log("[v0] Usuarios encontrados:", rows.length);

    if (rows.length === 0) {
      console.log("[v0] No se encontró usuario con identifier:", identifier);
      return null;
    }

    const user = rows[0];
    console.log("[v0] Usuario encontrado:", { id: user.id_user, email: user.email, rol: user.rol, estado: user.estado });

    const match = await bcrypt.compare(password, user.password);
    console.log("[v0] Contraseña coincide:", match);

    if (match) {
      return {
        id_user: user.id_user,
        nombres: user.nombres,
        apellidos: user.apellidos,
        email: user.email,
        codigo_user: user.codigo_user,
        rol: user.rol,
        estado: user.estado,
      };
    }
    return null;
  } catch (err) {
    console.error("[v0] Error en autenticarUsuario:", err.message);
    throw err;
  }
}
async function cambiarEstado(id, estado) {
  try {
    const [result] = await promisePool.query(
      "UPDATE usuarios SET estado = ? WHERE id_user = ?",
      [estado, id]
    );
    console.log("Estado actualizado para id:", id, "Resultado:", result.affectedRows);
    if (result.affectedRows === 0) {
      throw new Error("Empleado no encontrado");
    }
    return result;
  } catch (err) {
    console.error("Error en cambiarEstado:", err.message);
    throw err;
  }
}

// Insertar horario
async function insertarHorario(id_user, dia, hora_entrada, hora_salida, tolerancia) {
  try {
    const [result] = await promisePool.query(
      "INSERT INTO horarios (id_user, 	dia_semana, hora_entrada, hora_salida, tolerancia) VALUES (?, ?, ?, ?, ?)",
      [id_user, dia, hora_entrada, hora_salida, tolerancia]
    );
    console.log("Horario insertado con ID:", result.insertId);
    return { id: result.insertId };
  } catch (err) {
    console.error("Error en insertarHorario:", err.message);
    throw err;
  }
}
// Función eliminarHorario
// Función eliminarHorario
async function eliminarHorario(id_horario) {
  try {
    console.log("Ejecutando consulta: DELETE FROM horarios WHERE id_horario =", id_horario);
    const [horario] = await promisePool.query(
      "SELECT id_user FROM horarios WHERE id_horario = ?",
      [parseInt(id_horario)]
    );
    if (horario.length === 0) {
      console.warn("No se encontró ningún horario para id_horario:", id_horario);
      return false;
    }

    const [user] = await promisePool.query(
      "SELECT id_user FROM usuarios WHERE id_user = ?",
      [horario[0].id_user]
    );
    if (user.length === 0) {
      console.warn("El id_user asociado no existe:", horario[0].id_user);
      return false;
    }

    const [result] = await promisePool.query( // Cambiado a promisePool.query
      "DELETE FROM horarios WHERE id_horario = ?",
      [parseInt(id_horario)]
    );
    console.log("Eliminación para id_horario:", id_horario, "Affected rows:", result.affectedRows);
    if (result.affectedRows === 0) {
      console.warn("No se encontró ningún horario para eliminar con id_horario:", id_horario);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error en eliminarHorario:", err.message, "id_horario:", id_horario);
    throw err;
  }
}
// Listar horarios
async function listarHorarios() {
  try {
    const [rows] = await promisePool.query(
      "SELECT h.id_horario, h.id_user, u.nombres AS empleado, h.dia_semana, h.hora_entrada, h.hora_salida, h.tolerancia " +
      "FROM horarios h JOIN usuarios u ON h.id_user = u.id_user ORDER BY u.nombres, h.dia_semana"
    );
    console.log("Horarios listados:", rows.length);
    return rows;
  } catch (err) {
    console.error("Error en listarHorarios:", err.message);
    throw err;
  }
}
//listar envios
async function listarEnvios() {
  try {
    const [rows] = await promisePool.query(`
      SELECT id, cliente, curso, certificados, telefono, dni, departamento, provincia, distrito, 
             empresa_envio, sede_empresa, numero_orden, codigo_envio, observaciones, estado, 
             fecha_registro, fecha_actualizacion 
      FROM envios 
      ORDER BY fecha_registro DESC
    `);
    console.log("Envíos listados:", rows.length, "filas recuperadas");
    rows.forEach(row => console.log("Envio:", row));
    return rows;
  } catch (err) {
    console.error("Error en listarEnvios:", err.message);
    throw err;
  }
}
// Actualizar estado (ej. al imprimir -> 'En tránsito')
async function actualizarEstadoEnvio(id, nuevoEstado) {
    try {
        const [result] = await promisePool.query(
            "UPDATE envios SET estado = ?, fecha_actualizacion = NOW() WHERE id = ?",
            [nuevoEstado, id]
        );
        console.log("Actualización para ID:", id, "Affected rows:", result.affectedRows, "Nuevo estado:", nuevoEstado);
        if (result.affectedRows === 0) {
            console.warn("No se actualizó ningún registro para ID:", id);
        }
        return result.affectedRows > 0;
    } catch (err) {
        console.error("Error en actualizarEstadoEnvio:", err.message, "ID:", id, "Estado:", nuevoEstado);
        throw err;
    }
}

// Actualizar número de orden y código de envío (y cambiar estado a 'Enviado')
async function actualizarOrdenCodigoEnvio(id, numero_orden, codigo_envio) {
  try {
    const [result] = await promisePool.query(
      "UPDATE envios SET numero_orden = ?, codigo_envio = ?, estado = 'Enviado' WHERE id = ?",
      [numero_orden, codigo_envio, id]
    );
    console.log("Orden y código actualizados para ID:", id);
    return result.affectedRows > 0;
  } catch (err) {
    console.error("Error en actualizarOrdenCodigoEnvio:", err.message);
    throw err;
  }
}

// Contar envíos por estado (para contadores)
async function contarEnvios() {
  try {
    const [rows] = await promisePool.query(
      "SELECT estado, COUNT(*) as count FROM envios GROUP BY estado"
    );
    const [totalRows] = await promisePool.query("SELECT COUNT(*) as total FROM envios");
    const counts = { Pendiente: 0, 'En tránsito': 0, Enviado: 0, total: totalRows[0].total };
    rows.forEach(row => {
      counts[row.estado] = row.count;
    });
    console.log("Conteos de envíos calculados:", counts); // Log para depurar
    return counts;
  } catch (err) {
    console.error("Error en contarEnvios:", err.message);
    throw err;
  }
}
// Listar asistencias
async function listarAsistencias() {
  try {
    const [rows] = await promisePool.query(
      "SELECT a.id_asistencia, u.nombres AS nombre, a.fecha, a.hora_marcado, a.tipo, a.estado " +
      "FROM asistencias a JOIN usuarios u ON a.id_user = u.id_user ORDER BY a.fecha DESC"
    );
    console.log("Asistencias listadas:", rows.length);
    return rows;
  } catch (err) {
    console.error("Error en listarAsistencias:", err.message);
    throw err;
  }
}

// Contar usuarios activos
async function contarUsuariosActivos() {
  try {
    const [rows] = await promisePool.query(
      "SELECT COUNT(*) AS count FROM usuarios WHERE estado = 'Activo'"
    );
    console.log("Usuarios activos:", rows[0].count);
    return rows[0].count;
  } catch (err) {
    console.error("Error en contarUsuariosActivos:", err.message);
    throw err;
  }
}

async function obtenerPatronesPuntualidad() {
  try {
    const [rows] = await promisePool.query(
      "SELECT u.nombres AS nombre, COUNT(*) AS tardanzas, AVG(TIME_TO_SEC(TIMEDIFF(a.hora_marcado, h.hora_entrada)) / 60) AS minutos_tarde_promedio " +
      "FROM asistencias a " +
      "JOIN usuarios u ON a.id_user = u.id_user " +
      "JOIN horarios h ON a.id_user = h.id_user AND DAYNAME(a.fecha) = h.dia_semana " +
      "WHERE a.tipo = 'Entrada' AND a.estado = 'Tarde' " +
      "GROUP BY u.nombres HAVING tardanzas > 0 ORDER BY tardanzas DESC LIMIT 2"
    );
    console.log("Patrones de puntualidad:", rows);
    return rows;
  } catch (err) {
    console.error("Error en obtenerPatronesPuntualidad:", err.message);
    throw err;
  }
}
// Insertar caja
async function insertarCaja(id_admin, monto_inicial, fecha_entrega) {
    try {
        const [result] = await promisePool.query(
            "INSERT INTO caja_chica (id_admin, monto_inicial, saldo_actual, fecha_entrega, estado) VALUES (?, ?, ?, ?, ?)",
            [id_admin, monto_inicial, monto_inicial, fecha_entrega, 'Activo']
        );
        console.log("Caja insertada con ID:", result.insertId);
        return { id: result.insertId };
    } catch (err) {
        console.error("Error en insertarCaja:", err.message);
        throw err;
    }
}
async function insertarGasto(id_caja, descripcion, monto, tipo_comprobante, nro_comprobante, fecha) {
    try {
      monto = parseFloat(monto); // Convertir a número
    const [caja] = await promisePool.query("SELECT saldo_actual, estado FROM caja_chica WHERE id_caja = ?", [id_caja]);
    if (caja.length === 0) {
      throw new Error("Caja no encontrada");
    }
    console.log("Saldo actual:", caja[0].saldo_actual, "Monto:", monto, "Comparación:", caja[0].saldo_actual < monto);
    if (caja[0].estado !== 'Activo') {
      throw new Error("La caja no está activa");
    }
    if (caja[0].saldo_actual < monto) {
      throw new Error("Saldo insuficiente en la caja");
    }

        const connection = await promisePool.getConnection();
        try {
            await connection.beginTransaction();
            const [result] = await connection.query(
                "INSERT INTO gascaja (id_caja, descripcion, monto, tipo_comprobante, nro_comprobante, fecha, creado_en) VALUES (?, ?, ?, ?, ?, ?, NOW())",
                [id_caja, descripcion, monto, tipo_comprobante, nro_comprobante, fecha]
            );
            await connection.query(
                "UPDATE caja_chica SET saldo_actual = saldo_actual - ? WHERE id_caja = ?",
                [monto, id_caja]
            );
            await connection.commit();
            console.log("Gasto insertado con ID:", result.insertId);
            return { id: result.insertId };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
    console.error("Error en insertarGasto:", err.message);
    throw err;
  }
}
// Listar cajas
async function listarCajas() {
  try {
    const [rows] = await promisePool.query(
      "SELECT id_caja, id_admin, monto_inicial, saldo_actual, fecha_entrega, estado FROM caja_chica ORDER BY fecha_entrega DESC"
    );
    console.log("Cajas listadas:", rows.length);
    return rows;
  } catch (err) {
    console.error("Error en listarCajas:", err.message);
    throw err;
  }
}

// Listar gastos
async function listarGastos() {
  try {
    const [rows] = await promisePool.query(
      "SELECT g.id_gasto, g.id_caja, c.id_caja AS caja, g.descripcion, g.monto, g.tipo_comprobante, g.nro_comprobante, g.fecha, g.creado_en " +
      "FROM gascaja g JOIN caja_chica c ON g.id_caja = c.id_caja ORDER BY g.fecha DESC"
    );
    console.log("Gastos listados:", rows.length);
    return rows;
  } catch (err) {
    console.error("Error en listarGastos:", err.message);
    throw err;
  }
}

// Obtener caja activa
async function obtenerCajaActiva() {
  try {
    const [rows] = await promisePool.query(
      "SELECT id_caja, monto_inicial, saldo_actual, fecha_entrega FROM caja_chica WHERE estado = 'Activo' LIMIT 1"
    );
    console.log("Caja activa obtenida:", rows.length);
    return rows[0] || null;
  } catch (err) {
    console.error("Error en obtenerCajaActiva:", err.message);
    throw err;
  }
}

// Obtener gastos del día
async function obtenerGastosDia(fecha) {
  try {
    const [rows] = await promisePool.query(
      "SELECT SUM(monto) AS total_gastos FROM gascaja WHERE DATE(fecha) = ?",
      [fecha]
    );
    console.log("Gastos del día calculados:", rows[0].total_gastos);
    return rows[0].total_gastos || 0;
  } catch (err) {
    console.error("Error en obtenerGastosDia:", err.message);
    throw err;
  }
}
module.exports = {
  insertarUsuario,
  verificarGerente,
  autenticarUsuario,
  listarEmpleados,
  insertarEmpleado,
  cambiarEstado,
  insertarHorario,
  listarHorarios,
  listarEnvios,
  actualizarEstadoEnvio,
  actualizarOrdenCodigoEnvio,
  contarEnvios,
  eliminarHorario,
  listarAsistencias,
  contarUsuariosActivos,
  obtenerPatronesPuntualidad,
  insertarCaja,
  insertarGasto,
  listarCajas,
  listarGastos,
  obtenerCajaActiva,
  obtenerGastosDia,
  promisePool,
  
};